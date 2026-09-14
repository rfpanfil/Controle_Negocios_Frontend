import { test, expect } from '@playwright/test';

test.describe('Controle de Negocios E2E - Cobertura Completa', () => {
  const baseURL = 'http://localhost:3002';

  test.beforeEach(async ({ page }) => {
    let db = {
      origens: [{ id: 1, nome: 'Origem Mock' }, { id: 2, nome: 'Indicação' }],
      categorias: [{ id: 1, nome: 'Categoria Mock' }, { id: 2, nome: 'Produto A' }],
      usuarios: [{ id: 1, username: 'admin', nome: 'Admin Mock', is_active: true }, { id: 2, username: 'vendedor1', nome: 'Vendedor 1', is_active: true }],
      itensPadrao: [],
      leads: [],
      propostas: [],
      motivosPerda: [{ id: 1, nome: 'Preço' }],
      fups: []
    };

    await page.route('http://localhost:8003/**', async route => {
      const url = route.request().url();
      const method = route.request().method();

      // Permitir auth real para que loginAs funcione sem alterar a resposta do endpoint /login
      if (url.includes('/auth/login') || url.includes('/login') || url.includes('/token') || url.includes('/auth/')) {
        return route.continue();
      }

      if (method === 'OPTIONS') return route.continue();

      try {
        if (method === 'GET') {
          if (url.includes('/configuracoes/origens-lead')) return route.fulfill({ json: db.origens });
          if (url.includes('/configuracoes/categorias')) return route.fulfill({ json: db.categorias });
          if (url.endsWith('/usuarios') || url.endsWith('/usuarios/')) return route.fulfill({ json: db.usuarios });
          if (url.includes('/configuracoes/motivos-perda')) return route.fulfill({ json: db.motivosPerda });
          
          if (url.includes('/configuracoes/itens-padrao')) return route.fulfill({ json: db.itensPadrao });
          
          if (url.includes('/leads')) {
            const match = url.match(/\/leads\/(\d+)/);
            if (match) {
              const lead = db.leads.find(l => l.id === parseInt(match[1]));
              if(lead) {
                lead.followups = db.fups.filter(f => f.lead_id === lead.id);
                return route.fulfill({ json: lead });
              }
              return route.fulfill({ status: 404, json: { detail: 'Lead not found' } });
            }
            return route.fulfill({ json: db.leads });
          }

          if (url.includes('/followups')) {
            return route.fulfill({ json: db.fups });
          }

          if (url.includes('/propostas')) {
            const match = url.match(/\/propostas\/(\d+)/);
            if (match) {
              const p = db.propostas.find(p => p.id === parseInt(match[1]));
              if(p) return route.fulfill({ json: p });
              return route.fulfill({ status: 404, json: { detail: 'Proposta not found' } });
            }
            return route.fulfill({ json: db.propostas });
          }

          if (url.includes('/dashboard/metricas')) {
             return route.fulfill({ json: { leads_novos: 1, propostas_abertas: 1, fups_atrasados: 1, vendas_mes: 1 } });
          }
        }

        if (method === 'POST') {
          const body = JSON.parse(route.request().postData() || '{}');
          if (url.includes('/configuracoes/itens-padrao')) {
            const newItem = { id: Date.now(), ...body };
            db.itensPadrao.push(newItem);
            return route.fulfill({ status: 201, json: newItem });
          }
          if (url.includes('/leads')) {
            const newItem = { id: Date.now(), status: 'Novo', data_cadastro: new Date().toISOString(), ...body };
            db.leads.push(newItem);
            return route.fulfill({ status: 201, json: newItem });
          }
          if (url.includes('/propostas')) {
            const newItem = { 
              id: Date.now(), 
              status: 'Em Elaboração', 
              data_criacao: new Date().toISOString(),
              custo_material: 0,
              ...body 
            };
            db.propostas.push(newItem);
            return route.fulfill({ status: 201, json: newItem });
          }
          if (url.includes('/followups')) {
            const newItem = { id: Date.now(), ...body };
            db.fups.push(newItem);
            return route.fulfill({ status: 201, json: newItem });
          }
          
          return route.fulfill({ status: 201, json: { id: Date.now(), success: true } });
        }

        if (method === 'PUT' || method === 'PATCH') {
          const body = JSON.parse(route.request().postData() || '{}');
          if (url.includes('/configuracoes/itens-padrao')) {
            const id = parseInt(url.split('/').filter(Boolean).pop());
            const index = db.itensPadrao.findIndex(i => i.id === id);
            if(index !== -1) db.itensPadrao[index] = { ...db.itensPadrao[index], ...body };
            return route.fulfill({ status: 200, json: db.itensPadrao[index] });
          }
          if (url.includes('/leads')) {
            const match = url.match(/\/leads\/(\d+)/);
            if (match) {
               const id = parseInt(match[1]);
               const index = db.leads.findIndex(i => i.id === id);
               if(index !== -1) db.leads[index] = { ...db.leads[index], ...body };
               return route.fulfill({ status: 200, json: db.leads[index] });
            }
          }
          if (url.includes('/propostas')) {
            const match = url.match(/\/propostas\/(\d+)/);
            if (match) {
               const id = parseInt(match[1]);
               const index = db.propostas.findIndex(i => i.id === id);
               if(index !== -1) db.propostas[index] = { ...db.propostas[index], ...body };
               return route.fulfill({ status: 200, json: db.propostas[index] });
            }
          }
          
          return route.fulfill({ status: 200, json: { success: true } });
        }

        if (method === 'DELETE') {
          if (url.includes('/configuracoes/itens-padrao')) {
             const id = parseInt(url.split('/').filter(Boolean).pop());
             db.itensPadrao = db.itensPadrao.filter(i => i.id !== id);
             return route.fulfill({ status: 200, json: { success: true } });
          }
          if (url.includes('/leads')) {
             const match = url.match(/\/leads\/(\d+)/);
             if(match) {
               const id = parseInt(match[1]);
               const index = db.leads.findIndex(i => i.id === id);
               if(index !== -1) db.leads[index].status = 'Inativo';
               return route.fulfill({ status: 200, json: { success: true } });
             }
          }
          return route.fulfill({ status: 200, json: { success: true } });
        }
      } catch (e) {
        console.error('Mock error', e);
      }
      route.continue();
    });
  });

  async function loginAs(page, user, pass) {
    await page.goto(`${baseURL}/login`);
    await page.fill('input[placeholder="Digite seu login"]', user);
    await page.fill('input[placeholder="Digite sua senha"]', pass);
    await page.click('button[type="submit"]');
    await page.waitForURL(baseURL + '/');
  }

  test('Auth: Login, Logout e verificação de layout', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    await page.click('button:has-text("Demo Admin")');
    await page.click('button[type="submit"]');
    await page.waitForURL(baseURL + '/');
    await expect(page.locator('h2:has-text("Visão Geral do Comercial")')).toBeVisible();
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${baseURL}/login`);
    await expect(page.locator('h1.login-title')).toBeVisible();
  });

  test('Auth: Role-based (vendedor1) - Select Responsável desabilitado', async ({ page }) => {
    await loginAs(page, 'vendedor1', 'csb2026');
    await page.goto(`${baseURL}/leads`);
    await page.click('button:has-text("Novo Lead")');
    const label = page.locator('label', { hasText: 'Responsável' });
    const select = page.locator('.form-group').filter({ has: label }).locator('select');
    await expect(select).toBeDisabled();
  });

  test('Configurações: CRUD de Itens Padrão', async ({ page }) => {
    await loginAs(page, 'admin', 'admin123');
    await page.goto(`${baseURL}/configuracoes`);
    await page.click('button:has-text("Itens Padrão")');
    const itemName = 'Serviço E2E Test ' + Date.now();
    await page.fill('input[placeholder="Descrição do item..."]', itemName);
    await page.fill('input[placeholder="Valor Unitário (R$)"]', '150.50');
    await page.click('button:has-text("Adicionar")');
    await expect(page.locator(`td`, { hasText: itemName })).toBeVisible();
    const row = page.locator('tr', { hasText: itemName });
    await row.locator('button').nth(0).click();
    await page.fill('input[placeholder="Descrição do item..."]', itemName + ' Editado');
    await page.click('button:has-text("Atualizar")');
    await expect(page.locator(`td`, { hasText: itemName + ' Editado' })).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    const rowEdited = page.locator('tr', { hasText: itemName + ' Editado' });
    await Promise.all([
      page.waitForResponse(res => res.url().includes('itens-padrao') && res.request().method() === 'DELETE'),
      rowEdited.locator('button').nth(1).click()
    ]);
    await expect(page.locator(`td`, { hasText: itemName + ' Editado' })).not.toBeVisible();
  });

  test('Dashboard: Follow-ups Atrasados redireciona para leads', async ({ page }) => {
    await loginAs(page, 'admin', 'admin123');
    const kpi = page.locator('.kpi-label', { hasText: 'Follow-ups Atrasados' });
    await kpi.click();
    await expect(page).toHaveURL(/.*\/leads\?filtro=atrasados/);
  });

  test('Leads e Follow-ups: CRUD completo', async ({ page }) => {
    page.on('response', async res => {
      if (res.status() >= 400 && res.url().includes('8003')) {
        console.log('API Error: ', res.url(), res.status(), await res.text().catch(()=>''));
      }
    });
    await loginAs(page, 'admin', 'admin123');
    await page.goto(`${baseURL}/leads`);
    const leadName = 'Lead E2E ' + Date.now();
    await page.click('button:has-text("Novo Lead")');
    
    const modal = page.locator('.modal-content');
    
    // Fill ALL fields
    await modal.locator('input[type="text"]').nth(0).fill(leadName); // nome
    await modal.locator('input[type="email"]').fill('lead@test.com');
    await modal.locator('input[type="text"]').nth(1).fill('11999999999'); // telefone
    await modal.locator('input[type="text"]').nth(2).fill('Empresa Teste SA'); // empresa_nome
    await modal.locator('input[type="text"]').nth(3).fill('12.345.678/0001-99'); // cnpj_cpf
    
    await modal.locator('label:has-text("Origem")').locator('..').locator('select').selectOption({ index: 1 });
    await modal.locator('label:has-text("Categoria de Interesse")').locator('..').locator('select').selectOption({ index: 1 });
    await modal.locator('label:has-text("Responsável")').locator('..').locator('select').selectOption({ index: 1 });
    
    await modal.locator('textarea').fill('Observacoes de teste para o lead E2E 100% preenchido');
    
    await modal.locator('input[placeholder*="Ex: Ligar na sexta-feira"]').fill('Enviar e-mail na proxima semana');
    await modal.locator('input[type="date"]').last().fill('2026-10-10');
    
    await modal.locator('button:has-text("Salvar")').click();
    await expect(modal).toBeHidden();
    
    // Buscar
    await page.fill('input[placeholder="Buscar nome, e-mail, telefone..."]', leadName);
    await expect(page.locator(`td`, { hasText: leadName })).toBeVisible();
    
    // Detalhe
    await page.locator(`tr`, { hasText: leadName }).first().click();
    await expect(page.locator('h2', { hasText: leadName })).toBeVisible();
    
    // Add Follow-up
    await page.click('button:has-text("Novo Follow-Up")');
    const fupModal = page.locator('.modal-content').last();
    // Fill ALL fields
    await fupModal.locator('select').first().selectOption({ index: 1 }); // tipo
    await fupModal.locator('textarea').fill('Follow up de teste E2E completo');
    await fupModal.locator('input[type="text"]').fill('Próxima ação teste fup');
    await fupModal.locator('input[type="date"]').fill('2026-11-11');
    await fupModal.locator('input[type="checkbox"]').check(); // encerrarLead
    
    await fupModal.locator('button:has-text("Salvar")').click();
    await expect(page.locator('.timeline-desc', { hasText: 'Follow up de teste E2E completo' })).toBeVisible();
    
    // Fechar detalhe
    await page.locator('.page-header .btn-icon').first().click(); // ArrowLeft
    
    // Editar Lead
    const row = page.locator(`tr`, { hasText: leadName }).first();
    await row.locator('button[title="Editar"]').click();
    await modal.locator('input[type="text"]').nth(0).fill(leadName + ' Alterado');
    await modal.locator('input[type="email"]').fill('alterado@test.com');
    await modal.locator('button:has-text("Salvar")').click();
    
    await expect(page.locator(`td`, { hasText: leadName + ' Alterado' })).toBeVisible();
    
    // Excluir
    page.once('dialog', dialog => dialog.accept());
    const rowAlt = page.locator(`tr`, { hasText: leadName + ' Alterado' }).first();
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/leads') && res.request().method() === 'DELETE'),
      rowAlt.locator('button[title="Excluir"]').click()
    ]);
    
    // Selecionar filtro inativo
    await page.selectOption('select:has-text("Status (Todos)")', 'Inativo');
    await expect(page.locator(`td`, { hasText: leadName + ' Alterado' })).toBeVisible();
  });

  test('Propostas: CRUD, Itens Padrão, Pipeline', async ({ page }) => {
    page.on('response', async res => {
      if (res.status() >= 400 && res.url().includes('8003')) {
        console.log('API Error: ', res.url(), res.status(), await res.text().catch(()=>''));
      }
    });
    await loginAs(page, 'admin', 'admin123');
    
    // 1. Criar Item Padrão
    await page.goto(`${baseURL}/configuracoes`);
    await page.click('button:has-text("Itens Padrão")');
    const itemProp = 'Item Padrão E2E ' + Date.now();
    await page.fill('input[placeholder="Descrição do item..."]', itemProp);
    await page.fill('input[placeholder="Valor Unitário (R$)"]', '100');
    await page.click('button:has-text("Adicionar")');
    await expect(page.locator('td', { hasText: itemProp })).toBeVisible();

    // 2. Criar Lead
    await page.goto(`${baseURL}/leads`);
    const propLeadName = 'Lead Proposta E2E ' + Date.now();
    await page.click('button:has-text("Novo Lead")');
    const leadModal = page.locator('.modal-content');
    // Fill ALL fields
    await leadModal.locator('input[type="text"]').nth(0).fill(propLeadName);
    await leadModal.locator('input[type="email"]').fill('leadprop@test.com');
    await leadModal.locator('input[type="text"]').nth(1).fill('11888888888'); 
    await leadModal.locator('input[type="text"]').nth(2).fill('Empresa Prop SA'); 
    await leadModal.locator('input[type="text"]').nth(3).fill('11.111.111/0001-11'); 
    
    await leadModal.locator('label:has-text("Origem")').locator('..').locator('select').selectOption({ index: 1 });
    await leadModal.locator('label:has-text("Categoria de Interesse")').locator('..').locator('select').selectOption({ index: 1 });
    await leadModal.locator('label:has-text("Responsável")').locator('..').locator('select').selectOption({ index: 1 });
    await leadModal.locator('textarea').fill('Lead para proposta');
    await leadModal.locator('input[placeholder*="Ex: Ligar na sexta-feira"]').fill('Acao propo');
    await leadModal.locator('input[type="date"]').last().fill('2026-10-10');
    await leadModal.locator('button:has-text("Salvar")').click();
    await expect(leadModal).toBeHidden();

    // 3. Criar Proposta
    await page.goto(`${baseURL}/propostas`);
    await page.click('button:has-text("Nova Proposta")');
    const propModal = page.locator('.modal-content');
    
    await propModal.locator('.css-13cymwt-control, .select__control').first().click();
    await page.keyboard.type(propLeadName);
    await page.keyboard.press('Enter');
    
    const propTitle = 'Proposta E2E ' + Date.now();
    // Fill ALL fields
    await propModal.locator('label:has-text("Título da Proposta *")').locator('..').locator('input').fill(propTitle);
    await propModal.locator('textarea').fill('Descricao completa da proposta 100% preenchida');
    
    // Adicionar Item
    await propModal.locator('label:has-text("Item Padrão")').locator('..').locator('select').selectOption({ label: itemProp });
    
    await propModal.locator('input[type="number"]').first().fill('2'); 
    await propModal.locator('input[type="number"]').nth(1).fill('150'); 
    await propModal.locator('button.btn-primary:has(svg.lucide-plus)').first().click();
    
    await propModal.locator('input[type="date"]').fill('2026-12-31');
    
    await propModal.locator('button:has-text("Criar Proposta")').click();
    
    // 4. Proposta Detalhe
    await expect(page.locator(`h3.modal-title`, { hasText: propTitle })).toBeVisible();
    
    // Editar custo material (click icon)
    await page.locator('span:has-text("Custo de Material")').locator('button').click();
    await page.locator('input[type="number"]').first().fill('10');
    await page.locator('input[type="number"]').first().locator('..').locator('button').first().click();
    
    // Enviar
    await page.click('button:has-text("Marcar como Enviada")');
    await expect(page.locator('h3.modal-title .badge-blue')).toBeVisible(); // badge Enviada
    
    await page.locator('.modal-close').first().click();
    
    // 5. Pipeline
    await page.goto(`${baseURL}/pipeline`);
    const colunaEnviada = page.locator('.kanban-column', { hasText: 'Enviada' });
    await expect(colunaEnviada.locator('.kanban-card-title', { hasText: propTitle })).toBeVisible();
  });

});
