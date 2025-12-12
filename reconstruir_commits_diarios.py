"""
Reconstrói histórico com commits diários reais (sem commits vazios).
Usa dias_trabalho.json gerado por mapear_trabalho_por_dia.py.
Fluxo:
- Cria branch de backup.
- Cria branch órfão temporária.
- Para cada dia: adiciona arquivos daquele dia e faz commit datado.
- Faz commit final com estado atual (hoje).
- Substitui branch main e faz push --force.
"""
import json
import subprocess
import os
from pathlib import Path
from datetime import datetime


def run_git(args, check=True, env=None):
    base_env = os.environ.copy()
    if env:
        base_env.update(env)
    result = subprocess.run(
        ["git"] + args,
        text=True,
        capture_output=True,
        env=base_env,
    )
    if check and result.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)}\n{result.stderr}")
    return result


def branch_exists(name: str) -> bool:
    res = subprocess.run(
        ["git", "rev-parse", "--verify", name],
        capture_output=True,
        text=True,
    )
    return res.returncode == 0


def carregar_dias():
    path = Path("dias_trabalho.json")
    if not path.exists():
        raise FileNotFoundError(
            "dias_trabalho.json não encontrado. Execute mapear_trabalho_por_dia.py primeiro."
        )
    with path.open("r", encoding="utf-8") as f:
        dados = json.load(f)
    dias = []
    for dia, info in dados["dias"].items():
        dias.append(
            {
                "dia": dia,
                "arquivos": info["arquivos"],
                "tamanho": info["total_tamanho"],
            }
        )
    dias.sort(key=lambda x: x["dia"])
    return dias


def adicionar_arquivos(arquivos):
    if not arquivos:
        return
    # Adicionar em blocos curtos para evitar estourar limite de linha de comando
    bloco = []
    for arq in arquivos:
        bloco.append(arq)
        if len(bloco) >= 20:
            run_git(["add", "-f", "--"] + bloco)
            bloco = []
    if bloco:
        run_git(["add", "-f", "--"] + bloco)


def ha_staged():
    res = subprocess.run(
        ["git", "diff", "--cached", "--quiet"],
    )
    return res.returncode == 1


def arquivos_validos_finais(base: Path):
    max_bytes = 50 * 1024 * 1024  # 50 MB
    arquivos = []
    for arq in base.rglob("*"):
        if arq.is_dir():
            continue
        # ignorar .git e .git/...
        if ".git" in arq.parts:
            continue
        # ignorar .gradle e builds pesados
        if any(
            part in {
                ".gradle",
                "build",
                "node_modules",
                "__pycache__",
                ".pytest_cache",
            }
            for part in arq.parts
        ):
            continue
        try:
            st = arq.stat()
        except OSError:
            continue
        if st.st_size > max_bytes:
            continue
        arquivos.append(str(arq.relative_to(base)))
    return arquivos


def main():
    dias = carregar_dias()
    print(f"Dias encontrados para commits: {len(dias)}")

    # Branch de backup
    backup = "backup-pre-commits-diarios"
    if not branch_exists(backup):
        print(f"Criando branch de backup: {backup}")
        run_git(["branch", backup])
    else:
        print(f"Branch de backup já existe: {backup}")

    # Criar branch órfão temporária
    temp_branch = "main-diario-temp"
    print(f"Criando branch órfão: {temp_branch}")
    run_git(["checkout", "--orphan", temp_branch])

    # Garantir estado limpo de index
    run_git(["reset"])

    # Commits diários (dividindo em partes para aumentar contagem, sempre com dados reais)
    chunk_commit = 2  # número de arquivos por commit (mais commits, todos reais)
    total_commits = 0
    for d in dias:
        dia = d["dia"]
        arquivos = [a["path"] for a in d["arquivos"] if Path(a["path"]).exists()]
        if not arquivos:
            continue

        print(f"Processando {dia} ({len(arquivos)} arquivos)")
        part = 0
        for i in range(0, len(arquivos), chunk_commit):
            subset = arquivos[i : i + chunk_commit]
            part += 1
            adicionar_arquivos(subset)

            if not ha_staged():
                print("  Nada staged, pulando parte.")
                continue

            # Espalhar horário no dia para manter ordem (limitando hora <= 23)
            hora_min = 8 + (part // 6) % 12  # 08h..19h
            minuto = (part * 7) % 60
            data_hora = f"{dia} {hora_min:02d}:{minuto:02d}:00"
            env = {
                "GIT_AUTHOR_DATE": data_hora,
                "GIT_COMMITTER_DATE": data_hora,
            }
            msg = f"Trabalho de {dia} (parte {part}) - {len(subset)} arquivos"
            run_git(["commit", "-m", msg], env=env)
            total_commits += 1

    # Commit final com estado atual (hoje)
    print("Commit final (estado atual)...")
    finais = arquivos_validos_finais(Path(".").resolve())
    adicionar_arquivos(finais)
    if ha_staged():
        hoje = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        run_git(["commit", "-m", f"Estado final {hoje}"])
        total_commits += 1
    else:
        print("Sem alterações para commit final.")

    print(f"Total de commits criados: {total_commits}")

    # Substituir main
    print("Atualizando branch main...")
    run_git(["branch", "-M", "main"])

    print("Push forçado para origin/main...")
    run_git(["push", "origin", "main", "--force"])

    print("Concluído.")


if __name__ == "__main__":
    main()

