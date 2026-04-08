import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWebsitePage } from '../src/connectors/website-reader-parser';

test('website parser extracts semantic fields from html', () => {
  const html = `
    <html>
      <head>
        <title>ACME Growth Platform</title>
        <meta name="description" content="Plataforma para vendas e finanças" />
      </head>
      <body>
        <nav><a href="/sobre">Sobre</a><a href="/contato">Contato</a></nav>
        <h1>Escala comercial com previsibilidade</h1>
        <h2>Resultados com contexto unificado</h2>
        <button>Agende uma demo</button>
        <section>Depoimento: melhoramos 30% a conversão.</section>
      </body>
    </html>
  `;

  const parsed = parseWebsitePage('https://acme.test', html);

  assert.equal(parsed.title, 'ACME Growth Platform');
  assert.ok(parsed.description.includes('vendas'));
  assert.ok(parsed.headings.length >= 2);
  assert.ok(parsed.ctas.some((entry) => entry.toLowerCase().includes('demo')));
  assert.ok(parsed.navigation.includes('Sobre'));
});
