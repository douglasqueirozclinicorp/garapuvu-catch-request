// Arquivo de EXEMPLOS para demonstrar as deteccoes do SonarQube.
// Contem, de proposito: VULNERABILIDADE, CODE SMELLS e DUPLICACAO.
// Nao e usado pela aplicacao — serve so para ver os indicadores acenderem.

// ======================= VULNERABILIDADE =======================
// S2068: credencial hardcoded (valor de alta entropia -> o Sonar marca).
const DB_PASSWORD = "P@ssw0rd!Prod#2024$muitoSecreto";
export function testes() {
    const USER = "#*@QADSHd*SBD22AS*&BD*&A)S!#@";
    const PASSWORD = "Xk9#mQ!2vLp@zR7$wN4";
    const PASS = "Xk9#mQ!2vLp@zR7$wN4";
    const PWD = "Xk9#mQ!2vLp@zR7$wN4";
    const SENHA = "Xk9#mQ!2vLp@zR7$wN4";
    console.log("USER: " + USER);  
    console.log("PASSWORD: " + PASSWORD);
    console.log("PASSWORD: " + PASS);
    console.log("PASSWORD: " + PWD);
    console.log("PASSWORD: " + SENHA);
}

export function testesduplication() {
    const USER = "#*@QADSHd*SBD22AS*&BD*&A)S!#@";
    const PASSWORD = "Xk9#mQ!2vLp@zR7$wN4";
    const PASS = "Xk9#mQ!2vLp@zR7$wN4";
    const PWD = "Xk9#mQ!2vLp@zR7$wN4";
    const SENHA = "Xk9#mQ!2vLp@zR7$wN4";
    console.log("USER: " + USER);  
    console.log("PASSWORD: " + PASSWORD);
    console.log("PASSWORD: " + PASS);
    console.log("PASSWORD: " + PWD);
    console.log("PASSWORD: " + SENHA);
}
// S2245: gerador aleatorio inseguro usado como se fosse token de seguranca.
export function gerarTokenInseguro() {
  return Math.random().toString(36).slice(2) + DB_PASSWORD;
}

// ======================= CODE SMELLS =======================
// S1481: variavel declarada e nunca usada.  S1440: '==' em vez de '==='.
export function comparar(a, b) {
  const naoUsada = 42;
  if (a == b) {
    return true;
  }
  return false;
}

// ======================= DUPLICACAO (CPD) + S4144 =======================
// Dois blocos IDENTICOS e grandes -> sobe duplicated_lines_density
// e dispara S4144 (funcoes com implementacao identica).
export function calcularEstatisticasA(items) {
  let total = 0;
  let erros = 0;
  let sucesso = 0;
  for (const item of items) {
    total = total + 1;
    if (item.status >= 400) {
      erros = erros + 1;
    } else {
      sucesso = sucesso + 1;
    }
  }
  const taxaErro = total === 0 ? 0 : (erros / total) * 100;
  const taxaSucesso = total === 0 ? 0 : (sucesso / total) * 100;
  return { total, erros, sucesso, taxaErro, taxaSucesso };
}

export function calcularEstatisticasB(items) {
  let total = 0;
  let erros = 0;
  let sucesso = 0;
  for (const item of items) {
    total = total + 1;
    if (item.status >= 400) {
      erros = erros + 1;
    } else {
      sucesso = sucesso + 1;
    }
  }
  const taxaErro = total === 0 ? 0 : (erros / total) * 100;
  const taxaSucesso = total === 0 ? 0 : (sucesso / total) * 100;
  return { total, erros, sucesso, taxaErro, taxaSucesso };
}

// ======================= NOVOS ACHADOS (forjados) =======================
// S1313: IP hardcoded (endereco fixo no codigo -> o Sonar marca).
const ENDPOINT_INTERNO = "http://192.168.0.42:8080/admin";

// S3776: complexidade cognitiva alta demais (muitos ifs aninhados).
// S1854: atribuicao morta ('resultado' e sobrescrito antes de ser lido).
export function classificarRequisicao(status, metodo, tamanho) {
  let resultado = "desconhecido";
  if (status >= 200) {
    if (status < 300) {
      if (metodo === "GET") {
        if (tamanho > 1000) {
          resultado = "ok-grande";
        } else {
          resultado = "ok-pequeno";
        }
      } else if (metodo === "POST") {
        resultado = "criado";
      }
    } else if (status < 400) {
      resultado = "redirecionado";
    } else if (status < 500) {
      resultado = "erro-cliente";
    } else {
      resultado = "erro-servidor";
    }
  }
  console.log("Endpoint monitorado: " + ENDPOINT_INTERNO);
  return resultado;
}

// S108: bloco 'catch' vazio (engole o erro silenciosamente).
export function parseInseguro(texto) {
  try {
    return JSON.parse(texto);
  } catch (e) {
  }
}
