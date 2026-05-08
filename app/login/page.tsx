'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginPage.module.css';

const LOGO_SIMPLES = '/branding/logo-bonito-simples.png';
const LOGO_BONITO = '/branding/logo-bonito.png';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({
    nomeEmpresa: '',
    cnpj: '',
    nomeResponsavel: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: '',
    certificacoes: '',
    observacoes: '',
  });
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.body.classList.add('login-page');

    const handleScroll = () => {
      const scrollBtn = document.getElementById('scrollToTop');
      if (scrollBtn) {
        if (window.scrollY > 300) {
          scrollBtn.style.opacity = '1';
          scrollBtn.style.pointerEvents = 'auto';
        } else {
          scrollBtn.style.opacity = '0';
          scrollBtn.style.pointerEvents = 'none';
        }
      }
    };
    window.addEventListener('scroll', handleScroll);

    const reveals = document.querySelectorAll<HTMLElement>('[data-reveal]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    reveals.forEach((el) => observer.observe(el));

    return () => {
      document.body.classList.remove('login-page');
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToLogin = () => {
    const el = document.getElementById('loginSection');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.user.role === 'admin') router.push('/admin');
        else router.push('/');
      } else {
        setError(data.error || 'Erro no login');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro de conexão');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      const data = await response.json();
      if (response.ok) {
        setRegisterSuccess(true);
        setRegisterData({
          nomeEmpresa: '',
          cnpj: '',
          nomeResponsavel: '',
          email: '',
          telefone: '',
          cidade: '',
          estado: '',
          certificacoes: '',
          observacoes: '',
        });
        setTimeout(() => {
          setRegisterSuccess(false);
          setShowRegister(false);
        }, 5000);
      } else {
        setError(data.error || 'Erro ao enviar cadastro');
      }
    } catch (err) {
      console.error('Erro no cadastro:', err);
      setError('Erro de conexão');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className={styles.landingPage}>
      <div className={styles.animatedGradient} aria-hidden="true" />
      <div className={styles.ambientOrbs} aria-hidden="true">
        <span className={styles.orb} />
        <span className={styles.orb} />
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLogo} onClick={scrollToTop}>
            <img src={LOGO_SIMPLES} alt="General Inspetor" className={styles.logoImage} />
            <div className={styles.logoLabel}>
              <span className={styles.logoLabelTop}>General Inspetor</span>
              <span className={styles.logoLabelBot}>Laudos Técnicos</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnLoginHeader} onClick={scrollToLogin}>
              Acessar
            </button>
            <button className={styles.btnSignupHeader} onClick={() => setShowRegister(true)}>
              Cadastre-se
            </button>
          </div>
        </div>
      </header>

      {/* HERO SPLIT */}
      <section className={styles.hero} id="home">
        <div className={styles.heroContent}>
          {/* Brand editorial */}
          <div className={styles.heroBrand}>
            <span className={`${styles.heroEyebrow} ${styles.fadeUp}`} style={{ animationDelay: '0.05s' }}>
              General Inspetor · Plataforma de Laudos
            </span>

            <div className={`${styles.heroMark} ${styles.fadeUp}`} style={{ animationDelay: '0.1s' }}>
              <div className={styles.heroMarkGlow} aria-hidden="true" />
              <div className={styles.heroMarkRing} aria-hidden="true" />
              <div className={styles.heroMarkRingInner} aria-hidden="true" />
              <div className={styles.heroMarkCorners} aria-hidden="true">
                <span /><span />
              </div>
              <img src={LOGO_SIMPLES} alt="General Inspetor" className={styles.heroMarkImage} />
            </div>

            <h1 className={`${styles.heroTitle} ${styles.fadeUp}`} style={{ animationDelay: '0.25s' }}>
              Inspeções confiáveis,<br />
              <span className={styles.heroAccent}>laudos sem atrito.</span>
            </h1>

            <p className={`${styles.heroSubtitle} ${styles.fadeUp}`} style={{ animationDelay: '0.4s' }}>
              Plataforma profissional para emissão de laudos técnicos, controle de equipamentos
              e conformidade SASSMAQ — desenhada para inspetores que valorizam precisão e estética.
            </p>

            <div className={`${styles.heroMeta} ${styles.fadeUp}`} style={{ animationDelay: '0.55s' }}>
              <div className={styles.heroMetaItem}>
                <span className={styles.heroMetaLabel}>Conformidade</span>
                <span className={styles.heroMetaValue}>SASSMAQ · ISO</span>
              </div>
              <div className={styles.heroMetaItem}>
                <span className={styles.heroMetaLabel}>Integração</span>
                <span className={styles.heroMetaValue}>General TMS</span>
              </div>
              <div className={styles.heroMetaItem}>
                <span className={styles.heroMetaLabel}>Versão</span>
                <span className={styles.heroMetaValue}>2026 · v2</span>
              </div>
            </div>
          </div>

          {/* Console de login */}
          <div className={styles.heroConsole}>
            <div className={`${styles.loginCard} ${styles.fadeUp}`} id="loginSection" style={{ animationDelay: '0.5s' }}>
              <span className={styles.loginCardLabel}>Console · Acesso seguro</span>
              <div className={styles.loginTitle}>
                <h2>Acesse sua conta</h2>
                <p>Entre com suas credenciais para emitir laudos.</p>
              </div>

              {error && !showRegister && (
                <div className={styles.alertError}>{error}</div>
              )}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="username">Usuário</label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Digite seu usuário"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password">Senha</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Digite sua senha"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>

                <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                  <span>{isLoading ? 'Entrando…' : 'Entrar no Sistema'}</span>
                  {!isLoading && <span className={styles.btnArrow}>→</span>}
                </button>
              </form>

              <div className={styles.cardFootnote}>
                Ainda não tem acesso?{' '}
                <button onClick={() => setShowRegister(true)}>Solicitar credenciais</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS NUMERADOS */}
      <section className={styles.pillarsSection} data-reveal>
        <div className={styles.pillarsHead}>
          <div>
            <span className={styles.pillarsKicker}>Para quem é</span>
            <h2>Feito sob medida para profissionais técnicos.</h2>
          </div>
          <p>
            Inspetores, transportadoras e operadores logísticos que precisam de rastreabilidade,
            conformidade e laudos auditáveis em escala — sem ruído.
          </p>
        </div>

        <div className={styles.pillars}>
          <div className={styles.pillar}>
            <div className={styles.pillarNumber}>01 — INSPETORES</div>
            <h3>Profissionais técnicos com método.</h3>
            <p>
              Padronize a emissão, controle equipamentos e mantenha histórico completo
              de calibrações e certificações em um só lugar.
            </p>
          </div>
          <div className={styles.pillar}>
            <div className={styles.pillarNumber}>02 — TRANSPORTE</div>
            <h3>Frota em conformidade contínua.</h3>
            <p>
              Conformidade SASSMAQ e ISO automatizada, com alertas inteligentes
              de vencimento e auditoria sempre pronta.
            </p>
          </div>
          <div className={styles.pillar}>
            <div className={styles.pillarNumber}>03 — LOGÍSTICA</div>
            <h3>Documentação centralizada.</h3>
            <p>
              Operadores logísticos com rastreabilidade total de laudos,
              certificações e responsabilidades técnicas.
            </p>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className={styles.manifestoSection} data-reveal>
        <div className={styles.manifesto}>
          <div className={styles.manifestoMark}>— Nosso compromisso</div>
          <p>
            Acreditamos que laudos técnicos podem ser <em>precisos, auditáveis e bonitos</em>.
            Que conformidade não precisa ser burocrática. E que cada inspeção
            merece a mesma elegância do trabalho feito em campo.
          </p>
        </div>
      </section>

      {/* PROCESSO */}
      <section className={styles.processSection} data-reveal>
        <div className={styles.processHead}>
          <span className={styles.pillarsKicker}>Como funciona</span>
          <h2>Do campo ao PDF, em três passos.</h2>
        </div>

        <div className={styles.processFlow}>
          <div className={styles.processStep}>
            <div className={styles.processStepNum}>STEP 01</div>
            <h4>Inspeção em campo</h4>
            <p>
              Cadastre veículo, equipamento e cliente. Capture medições com seus instrumentos
              calibrados — tudo registrado com timestamp.
            </p>
          </div>
          <div className={styles.processStep}>
            <div className={styles.processStepNum}>STEP 02</div>
            <h4>Validação técnica</h4>
            <p>
              Sistema verifica conformidade automática, cruza vencimentos de calibração
              e bloqueia inconsistências antes da emissão.
            </p>
          </div>
          <div className={styles.processStep}>
            <div className={styles.processStepNum}>STEP 03</div>
            <h4>Emissão & arquivo</h4>
            <p>
              Laudo PDF com hash de verificação, assinado digitalmente e arquivado
              com todo o histórico para auditoria futura.
            </p>
          </div>
        </div>
      </section>

      {/* INTEGRAÇÃO TMS */}
      <section className={styles.integrationSection} data-reveal>
        <div className={styles.integrationContent}>
          <div className={styles.integrationText}>
            <span className={styles.pillarsKicker}>Ecossistema</span>
            <h2>Integração nativa com General TMS.</h2>
            <p>
              Usuários do <strong>GENERAL TMS</strong> contam com gestão unificada:
              veículos, motoristas, certificações e laudos sincronizados em tempo real.
            </p>
            <ul className={styles.integrationList}>
              <li>Veículos e frotas sincronizados automaticamente</li>
              <li>Vencimentos de laudos no painel do gestor</li>
              <li>Documentos centralizados e auditáveis</li>
              <li>Mapa de inspetores em tempo real</li>
              <li>Conformidade SASSMAQ ponta-a-ponta</li>
            </ul>
          </div>

          <div className={styles.integrationCard}>
            <img src={LOGO_BONITO} alt="General TMS" className={styles.integrationCardLogo} />
            <div className={styles.integrationCardLabel}>Sistema irmão</div>
            <div className={styles.integrationCardName}>General TMS</div>
            <p className={styles.integrationCardLine}>
              Truck Management System completo para transportadoras
              que buscam excelência operacional.
            </p>
            <a
              href="https://generaltms.terpens.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.integrationLink}
            >
              <span>Acessar General TMS</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection} data-reveal>
        <div className={styles.ctaContent}>
          <span className={styles.pillarsKicker} style={{ justifyContent: 'center' }}>
            Comece agora
          </span>
          <h2>Pronto para emitir laudos com método?</h2>
          <p>Acesse sua conta ou solicite credenciais para começar a usar a plataforma.</p>
          <div className={styles.ctaButtons}>
            <button className={styles.btnCtaPrimary} onClick={scrollToLogin}>
              Acessar Sistema
            </button>
            <button className={styles.btnCtaSecondary} onClick={() => setShowRegister(true)}>
              Solicitar credenciais
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.footerBrandRow}>
              <img src={LOGO_SIMPLES} alt="" className={styles.footerBrandLogo} />
              <div className={styles.footerBrandName}>
                <span className={styles.footerBrandTitle}>General Inspetor</span>
                <span className={styles.footerBrandSub}>Laudos Técnicos</span>
              </div>
            </div>
            <p>
              Plataforma profissional para emissão de laudos técnicos,
              controle de equipamentos e conformidade regulatória.
            </p>
          </div>

          <div className={styles.footerSection}>
            <h3>Plataforma</h3>
            <a href="#home">Emissão de Laudos</a>
            <a href="#home">Equipamentos</a>
            <a href="#home">SASSMAQ · ISO</a>
            <a href="#home">Vencimentos</a>
          </div>

          <div className={styles.footerSection}>
            <h3>Suporte</h3>
            <a href="mailto:contato@example.com">contato@example.com</a>
            <p>Atendimento especializado</p>
            <p>Onboarding e treinamento</p>
          </div>

          <div className={styles.footerSection}>
            <h3>Ecossistema</h3>
            <p>Integrado ao GENERAL TMS</p>
            <a href="https://sys.terpens.com.br" target="_blank" rel="noopener noreferrer">
              Acessar GENERAL TMS ↗
            </a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          © 2026 General Inspetor · Todos os direitos reservados ·{' '}
          <a href="https://terpens.com.br/" target="_blank" rel="noopener noreferrer">
            Desenvolvido por Terpens LLC
          </a>
        </div>
      </footer>

      {/* SCROLL TO TOP */}
      <div className={styles.scrollToTop} id="scrollToTop" onClick={scrollToTop}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 14l5-5 5 5z" />
        </svg>
      </div>

      {/* MODAL CADASTRO */}
      {showRegister && (
        <div className={styles.modalOverlay} onClick={() => setShowRegister(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowRegister(false)}>×</button>
            <div className={styles.registerHeader}>
              <h2>Solicitar acesso</h2>
              <p>Preencha os dados e nossa equipe entrará em contato.</p>
            </div>

            {registerSuccess && (
              <div className={styles.success}>
                Solicitação enviada com sucesso. Em breve entraremos em contato.
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleRegisterSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="nomeEmpresa">Nome da empresa *</label>
                <input
                  type="text"
                  id="nomeEmpresa"
                  value={registerData.nomeEmpresa}
                  onChange={(e) => setRegisterData({ ...registerData, nomeEmpresa: e.target.value })}
                  placeholder="Razão social"
                  required
                  disabled={registerLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cnpj">CNPJ *</label>
                <input
                  type="text"
                  id="cnpj"
                  value={registerData.cnpj}
                  onChange={(e) => setRegisterData({ ...registerData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  required
                  disabled={registerLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="nomeResponsavel">Responsável *</label>
                <input
                  type="text"
                  id="nomeResponsavel"
                  value={registerData.nomeResponsavel}
                  onChange={(e) => setRegisterData({ ...registerData, nomeResponsavel: e.target.value })}
                  placeholder="Nome completo"
                  required
                  disabled={registerLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="email@empresa.com.br"
                  required
                  disabled={registerLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="telefone">Telefone *</label>
                <input
                  type="tel"
                  id="telefone"
                  value={registerData.telefone}
                  onChange={(e) => setRegisterData({ ...registerData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  required
                  disabled={registerLoading}
                />
              </div>

              <div className={styles.inputRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="cidade">Cidade</label>
                  <input
                    type="text"
                    id="cidade"
                    value={registerData.cidade}
                    onChange={(e) => setRegisterData({ ...registerData, cidade: e.target.value })}
                    placeholder="Cidade"
                    disabled={registerLoading}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="estado">UF</label>
                  <input
                    type="text"
                    id="estado"
                    value={registerData.estado}
                    onChange={(e) => setRegisterData({ ...registerData, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                    disabled={registerLoading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="certificacoes">Certificações</label>
                <input
                  type="text"
                  id="certificacoes"
                  value={registerData.certificacoes}
                  onChange={(e) => setRegisterData({ ...registerData, certificacoes: e.target.value })}
                  placeholder="ISO 9001, SASSMAQ…"
                  disabled={registerLoading}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="observacoes">Observações</label>
                <textarea
                  id="observacoes"
                  value={registerData.observacoes}
                  onChange={(e) => setRegisterData({ ...registerData, observacoes: e.target.value })}
                  className={styles.textarea}
                  placeholder="Necessidades específicas"
                  rows={3}
                  disabled={registerLoading}
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton} disabled={registerLoading}>
                  {registerLoading ? 'Enviando…' : 'Enviar solicitação'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegister(false);
                    setError('');
                    setRegisterSuccess(false);
                  }}
                  className={styles.cancelButton}
                  disabled={registerLoading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
