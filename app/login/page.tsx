'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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
    
    // Scroll to top handler
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
    
    return () => {
      document.body.classList.remove('login-page');
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Erro no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
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
        headers: {
          'Content-Type': 'application/json',
        },
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
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setError('Erro de conexão');
    } finally {
      setRegisterLoading(false);
    }
  };

  const scrollToLogin = () => {
    setShowLogin(true);
  };

  return (
    <div className={styles.landingPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerPlaceholder}></div>
          <div className={styles.headerActions}>
            <button className={styles.btnLoginHeader} onClick={() => setShowLogin(true)}>
              Acessar
            </button>
            <button className={styles.btnSignupHeader} onClick={() => setShowRegister(true)}>
              Cadastre-se
            </button>
          </div>
        </div>
      </header>

      {/* Logo Luxuoso Flutuante */}
      <div className={styles.floatingLogoContainer}>
        <div className={styles.logoWrapper}>
          {/* Anel Rotativo Externo */}
          <div className={styles.logoRing}></div>
          {/* Anel Secundário */}
          <div className={styles.logoRingSecondary}></div>
          
          {/* Círculo Principal com Logo */}
          <div className={styles.logoCircle}>
            <img 
              src="/para app em geral.jpg"
              alt="General Emissor de Laudos"
              className={styles.logoImage}
            />
            {/* Partículas de Brilho */}
            <span className={styles.sparkle}></span>
            <span className={styles.sparkle}></span>
            <span className={styles.sparkle}></span>
            <span className={styles.sparkle}></span>
          </div>
        </div>
        
        {/* Texto Abaixo do Logo */}
        <div className={styles.logoTextContainer}>
          <div className={styles.logoTitle}>General Emissor de Laudos</div>
          <div className={styles.logoSubtitle}>Sistema de Gestão</div>
        </div>
      </div>

      {/* Hero Section */}
      <section className={styles.hero} id="home">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>Gestão Completa de Laudos Técnicos</h1>
            <p className={styles.heroSubtitle}>
              Sistema profissional para inspetores e empresas que precisam emitir laudos técnicos, 
              certificações e manter conformidade com SASSMAQ, ISO e regulamentações vigentes.
            </p>
            <div className={styles.heroFeatures}>
              <div className={styles.heroFeatureItem}>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span>Emissão de Laudos</span>
              </div>
              <div className={styles.heroFeatureItem}>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span>Controle de Equipamentos</span>
              </div>
              <div className={styles.heroFeatureItem}>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span>Conformidade SASSMAQ</span>
              </div>
              <div className={styles.heroFeatureItem}>
                <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                <span>Gestão de Vencimentos</span>
              </div>
            </div>
          </div>

          <div className={styles.loginCard}>
            <div className={styles.loginTitle}>
              <h2>Acesso ao Sistema</h2>
              <p>Entre com suas credenciais</p>
            </div>

            {error && showLogin && (
              <div className={styles.alertError}>
                {error}
              </div>
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
                />
              </div>
              
              <button type="submit" className={styles.btnLogin} disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar no Sistema'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Seção para quem serve */}
      <section className={styles.benefitsSection}>
        <div className={styles.sectionTitle}>
          <h2>Nossa solução é perfeita para</h2>
          <p>Profissionais e empresas que precisam de gestão técnica especializada</p>
        </div>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>👨‍🔧</span>
            <h3>Inspetores Técnicos</h3>
            <p>Profissionais que realizam inspeções e precisam emitir laudos de forma padronizada, com controle de equipamentos e certificações.</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>🚛</span>
            <h3>Empresas de Transporte</h3>
            <p>Transportadoras que precisam manter a frota em conformidade com SASSMAQ, ISO e outras certificações regulatórias.</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>🏢</span>
            <h3>Operadores Logísticos</h3>
            <p>Empresas que gerenciam frotas e precisam de rastreabilidade completa de laudos e certificações.</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>📋</span>
            <h3>Gestão de Equipamentos</h3>
            <p>Controle completo de equipamentos de medição com gestão de calibrações, certificações e vencimentos automáticos.</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>🔒</span>
            <h3>Conformidade Total</h3>
            <p>Mantenha sua empresa alinhada com exigências do SASSMAQ, com controle completo de documentos para auditorias.</p>
          </div>
          <div className={styles.benefitCard}>
            <span className={styles.benefitIcon}>📊</span>
            <h3>Documentação Centralizada</h3>
            <p>Centralize toda documentação de laudos, certificações e inspeções em um único sistema acessível.</p>
          </div>
        </div>
      </section>

      {/* Seção de Integração TMS */}
      <section className={styles.imageSection}>
        <div className={styles.imageContent}>
          <div className={styles.textContent}>
            <h2>Integração exclusiva com GENERAL TMS</h2>
            <p>
              Usuários do <strong>GENERAL TMS</strong> têm acesso a uma gestão aprimorada e completa 
              de laudos técnicos, com integração total entre os sistemas.
            </p>
            <ul>
              <li>Controle de laudos integrado ao TMS</li>
              <li>Gestão de vencimentos sincronizada</li>
              <li>Documentos centralizados na plataforma</li>
              <li>Mapa de inspetores em tempo real</li>
              <li>Conformidade SASSMAQ automatizada</li>
            </ul>
          </div>
          <div className={styles.imageBox}>
            <div className={styles.integrationBadge}>Integração Disponível</div>
          </div>
        </div>
      </section>

      {/* Fluxogramas */}
      <section className={styles.flowchartSection}>
        <div className={styles.flowchartContainer}>
          <div className={styles.sectionTitle} style={{color: 'white'}}>
            <h2>Como Funciona o Sistema</h2>
            <p>Processos automatizados para máxima eficiência</p>
          </div>

          {/* Fluxo 1: Equipamentos */}
          <div className={styles.flowchartBox}>
            <h3 className={styles.flowchartTitle}>🔧 Controle de Equipamentos</h3>
            <div className={styles.flowDiagram}>
              <div className={styles.flowStep}>
                <div className={styles.flowBox}>Cadastro Equipamento</div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>Calibração</div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>Certificação</div>
              </div>
              <div className={styles.flowArrow}>↓</div>
              <div className={styles.flowStep}>
                <div className={styles.flowBox}>Alerta Vencimento</div>
                <div className={styles.flowBox}>Renovação</div>
                <div className={styles.flowBox}>Auditoria</div>
              </div>
            </div>
          </div>

          {/* Fluxo 2: Laudos */}
          <div className={styles.flowchartBox}>
            <h3 className={styles.flowchartTitle}>📋 Emissão de Laudos</h3>
            <div className={styles.flowDiagram}>
              <div className={styles.flowStep}>
                <div className={styles.flowBox}>Inspeção</div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>Medições</div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>Validação</div>
              </div>
              <div className={styles.flowArrow}>↓</div>
              <div className={styles.flowStep}>
                <div className={styles.flowBox}>Emissão Laudo</div>
                <div className={styles.flowBox}>Assinatura Digital</div>
                <div className={styles.flowBox}>Arquivo PDF</div>
              </div>
            </div>
          </div>

          {/* Fluxo 3: Conformidade */}
          <div className={styles.flowchartBox}>
            <h3 className={styles.flowchartTitle}>✅ Conformidade SASSMAQ</h3>
            <div className={styles.flowDiagram}>
              <div className={styles.flowStep}>
                <div className={styles.flowBox}>Documentação</div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>Verificação</div>
                <div className={styles.flowArrow}>→</div>
                <div className={styles.flowBox}>Aprovação</div>
              </div>
              <div className={styles.flowArrow}>↓</div>
              <div className={styles.flowStep}>
                <div className={styles.flowBox}>Certificado</div>
                <div className={styles.flowBox}>Rastreabilidade</div>
                <div className={styles.flowBox}>Auditoria</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2>Transforme a gestão de laudos da sua empresa</h2>
          <p>Comece hoje mesmo a usar o sistema mais completo de gestão de laudos técnicos e certificações</p>
          <div className={styles.ctaButtons}>
            <button className={styles.btnCtaPrimary} onClick={() => setShowLogin(true)}>
              Acessar Sistema
            </button>
            <button className={styles.btnCtaSecondary} onClick={() => setShowRegister(true)}>
              Solicitar Demonstração
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>General Emissor de Laudos</h3>
            <p>Sistema completo de gestão de laudos técnicos para empresas que buscam excelência operacional e conformidade regulatória.</p>
          </div>
          <div className={styles.footerSection}>
            <h3>Funcionalidades</h3>
            <p><a href="#home">Emissão de Laudos</a></p>
            <p><a href="#home">Controle de Equipamentos</a></p>
            <p><a href="#home">Conformidade SASSMAQ</a></p>
            <p><a href="#home">Gestão de Vencimentos</a></p>
          </div>
          <div className={styles.footerSection}>
            <h3>Suporte</h3>
            <p><a href="mailto:contato@example.com">contato@example.com</a></p>
            <p>Atendimento especializado</p>
            <p>Treinamento e onboarding</p>
          </div>
          <div className={styles.footerSection}>
            <h3>Integração</h3>
            <p>Integrado ao GENERAL TMS</p>
            <p>API completa disponível</p>
            <p><a href="https://sys.terpens.com.br" target="_blank" rel="noopener noreferrer">Acessar GENERAL TMS</a></p>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; 2025 General Emissor de Laudos. Todos os direitos reservados. | <a href="https://terpens.com.br/" target="_blank" rel="noopener noreferrer">Desenvolvido por Terpens LLC</a></p>
        </div>
      </footer>

      {/* Scroll to Top */}
      <div className={styles.scrollToTop} id="scrollToTop" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M7 14l5-5 5 5z"/>
        </svg>
      </div>

      {/* Modal de Cadastro */}
      {showRegister && (
        <div className={styles.modalOverlay} onClick={() => setShowRegister(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setShowRegister(false)}>×</button>
            <div className={styles.registerForm}>
              <div className={styles.registerHeader}>
                <h2>Solicitar Acesso</h2>
                <p>Preencha os dados abaixo e nossa equipe entrará em contato</p>
              </div>

              {registerSuccess && (
                <div className={styles.success}>
                  Solicitação enviada com sucesso! Nossa equipe entrará em contato em breve.
                </div>
              )}

              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="nomeEmpresa">Nome da Empresa *</label>
                  <input
                    type="text"
                    id="nomeEmpresa"
                    value={registerData.nomeEmpresa}
                    onChange={(e) => setRegisterData({ ...registerData, nomeEmpresa: e.target.value })}
                    placeholder="Digite o nome da empresa"
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
                  <label htmlFor="nomeResponsavel">Nome do Responsável *</label>
                  <input
                    type="text"
                    id="nomeResponsavel"
                    value={registerData.nomeResponsavel}
                    onChange={(e) => setRegisterData({ ...registerData, nomeResponsavel: e.target.value })}
                    placeholder="Digite o nome do responsável"
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
                    <label htmlFor="estado">Estado</label>
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
                  <label htmlFor="certificacoes">Certificações (ISO, SASSMAQ, etc.)</label>
                  <input
                    type="text"
                    id="certificacoes"
                    value={registerData.certificacoes}
                    onChange={(e) => setRegisterData({ ...registerData, certificacoes: e.target.value })}
                    placeholder="Ex: ISO 9001, SASSMAQ"
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
                    placeholder="Informações adicionais sobre sua necessidade"
                    rows={3}
                    disabled={registerLoading}
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={registerLoading}
                  >
                    {registerLoading ? 'Enviando...' : 'Enviar Solicitação'}
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
        </div>
      )}
    </div>
  );
}
