"""
Mapeia arquivos do repositório por dia de modificação (mtime) e gera JSON.
Inclui apenas evidências reais de trabalho (sem builds/cache/binários pesados).
"""
from pathlib import Path
from datetime import datetime
import json
import os


IGNORAR_PASTAS = {
    ".git",
    ".cursor",
    "__pycache__",
    ".pytest_cache",
    "node_modules",
    "venv",
    ".venv",
    "env",
    ".idea",
    ".vscode",
    "dist",
    "build",
    ".gradle",
    ".gitmodules",
    ".svn",
    ".hg",
}

# Pastas específicas grandes que devem ser ignoradas
IGNORAR_SUBCAMINHOS = [
    Path("aplicativo") / "app novo" / "app" / "build",
    Path("aplicativo") / "backup geral" / "app novo" / "app" / "build",
    Path("aplicativo") / "app novo" / ".gradle",
    Path("aplicativo") / "backup geral" / "app novo" / ".gradle",
    Path("aplicativo") / "app novo" / "build",
    Path("aplicativo") / "backup geral" / "app novo" / "build",
]

# Extensões consideradas válidas para evidência de trabalho
EXTENSOES_PERMITIDAS = {
    ".py",
    ".md",
    ".txt",
    ".html",
    ".htm",
    ".js",
    ".ts",
    ".tsx",
    ".css",
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    ".kt",
    ".kts",
    ".java",
    ".sql",
    ".ini",
    ".cfg",
    ".conf",
    ".ps1",
    ".sh",
    ".bat",
    ".cmd",
    ".csv",
    ".ipynb",
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".svg",
    ".log",
    ".properties",
    ".gradle",
    ".jsp",
    ".gitignore",
}


def deve_ignorar(caminho: Path) -> bool:
    # Ignorar se qualquer parte do caminho estiver na lista
    for parte in caminho.parts:
        if parte in IGNORAR_PASTAS:
            return True

    # Ignorar subcaminhos específicos
    for sub in IGNORAR_SUBCAMINHOS:
        try:
            caminho.relative_to(sub)
            return True
        except ValueError:
            continue

    return False


def extensao_valida(caminho: Path) -> bool:
    ext = caminho.suffix.lower()
    return ext in EXTENSOES_PERMITIDAS


def mapear_por_dia(base: Path):
    hoje = datetime.now().date()
    dias = {}
    total_arquivos = 0
    total_tamanho = 0
    max_bytes = 50 * 1024 * 1024  # 50 MB

    for arquivo in base.rglob("*"):
        if arquivo.is_dir():
            continue
        if deve_ignorar(arquivo):
            continue
        if not extensao_valida(arquivo):
            continue

        try:
            stat = arquivo.stat()
        except OSError:
            continue

        # Ignorar arquivos muito grandes (limite de 50 MB)
        if stat.st_size > max_bytes:
            continue

        mtime = datetime.fromtimestamp(stat.st_mtime)
        # Ignorar arquivos de hoje para evitar falsos positivos
        if mtime.date() >= hoje:
            continue

        dia = mtime.strftime("%Y-%m-%d")
        rel = arquivo.relative_to(base)

        if dia not in dias:
            dias[dia] = {
                "arquivos": [],
                "total_tamanho": 0,
            }

        dias[dia]["arquivos"].append(
            {
                "path": str(rel),
                "size": stat.st_size,
            }
        )
        dias[dia]["total_tamanho"] += stat.st_size
        total_arquivos += 1
        total_tamanho += stat.st_size

    # Ordenar arquivos por tamanho desc em cada dia
    for dia, info in dias.items():
        info["arquivos"].sort(key=lambda x: -x["size"])

    return {
        "total_arquivos": total_arquivos,
        "total_tamanho_mb": round(total_tamanho / (1024 * 1024), 2),
        "dias": dias,
    }


def gerar_resumo(dados):
    resumo = []
    for dia, info in dados["dias"].items():
        resumo.append(
            {
                "dia": dia,
                "qtd_arquivos": len(info["arquivos"]),
                "tamanho_mb": round(info["total_tamanho"] / (1024 * 1024), 2),
            }
        )
    resumo.sort(key=lambda x: x["dia"])
    return resumo


def main():
    base = Path(".").resolve()
    print("=" * 80)
    print("MAPEANDO ARQUIVOS POR DIA (EVIDENCIA REAL)")
    print("=" * 80)
    print()

    dados = mapear_por_dia(base)
    resumo = gerar_resumo(dados)

    with open("dias_trabalho.json", "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

    with open("dias_trabalho_resumo.json", "w", encoding="utf-8") as f:
        json.dump(resumo, f, ensure_ascii=False, indent=2)

    print(f"Total de arquivos considerados: {dados['total_arquivos']}")
    print(f"Tamanho total: {dados['total_tamanho_mb']} MB")
    print(f"Dias encontrados: {len(dados['dias'])}")
    print()
    print("Arquivos gerados:")
    print("  - dias_trabalho.json (detalhado)")
    print("  - dias_trabalho_resumo.json (resumo)")
    print()
    print("Próximo passo: usar dias_trabalho.json para criar commits diários retroativos.")


if __name__ == "__main__":
    main()

