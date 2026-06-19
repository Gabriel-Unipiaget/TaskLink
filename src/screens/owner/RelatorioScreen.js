import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import RNPrint from 'react-native-print';
import XLSX from 'xlsx';
import RNFS from 'react-native-fs';
import { getMinhasClinicas, getAgendamentosByClinica } from '../../services/firestoreService';
import { colors, commonStyles } from '../../theme';

export default function RelatorioScreen() {
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState(null);

  const carregarDados = async () => {
    const clinicas = await getMinhasClinicas();
    let todos = [];
    for (const c of clinicas) {
      const ags = await getAgendamentosByClinica(c.id);
      todos = todos.concat(ags.map(a => ({ ...a, nomeClinica: c.nome })));
    }
    return { clinicas, agendamentos: todos };
  };

  const calcularKpis = (agendamentos) => {
    let confirmados = 0, cancelados = 0, pendentes = 0, receita = 0;
    for (const a of agendamentos) {
      if (a.status === 'confirmado') { confirmados++; receita += Number(a.preco) || 0; }
      else if (a.status === 'cancelado') cancelados++;
      else pendentes++;
    }
    return { total: agendamentos.length, confirmados, cancelados, pendentes, receita };
  };

  const buildHtml = (agendamentos, kpis) => {
    const dataAtual = new Date().toLocaleDateString('pt-BR');
    const linhasTabela = agendamentos.map(a => `
      <tr>
        <td>${a.nomeClinica || ''}</td>
        <td>${a.nomeServico || ''}</td>
        <td>${a.nomeCliente || ''}</td>
        <td>${a.data || ''} ${a.hora || ''}</td>
        <td style="color:${a.status === 'confirmado' ? '#4CAF50' : a.status === 'cancelado' ? '#E53935' : '#C9962A'}">
          ${a.status || ''}
        </td>
        <td>R$ ${Number(a.preco || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1C3A2F; }
          h1 { color: #1C3A2F; font-size: 22px; margin-bottom: 4px; }
          .subtitle { color: #888; font-size: 13px; margin-bottom: 24px; }
          .kpi-row { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
          .kpi { border: 1.5px solid #C9962A; border-radius: 10px; padding: 12px 18px; min-width: 120px; }
          .kpi-value { font-size: 26px; font-weight: bold; color: #C9962A; }
          .kpi-label { font-size: 12px; color: #888; margin-top: 2px; }
          .green { color: #4CAF50 !important; }
          .red { color: #E53935 !important; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #1C3A2F; color: #fff; padding: 8px; text-align: left; }
          td { padding: 7px 8px; border-bottom: 1px solid #eee; }
          tr:nth-child(even) { background: #f9f9f9; }
          h2 { font-size: 16px; margin: 24px 0 10px; }
        </style>
      </head>
      <body>
        <h1>Relatório TaskLink</h1>
        <div class="subtitle">Gerado em ${dataAtual}</div>
        <h2>Resumo geral</h2>
        <div class="kpi-row">
          <div class="kpi"><div class="kpi-value">${kpis.total}</div><div class="kpi-label">Total</div></div>
          <div class="kpi"><div class="kpi-value green">${kpis.confirmados}</div><div class="kpi-label">Confirmados</div></div>
          <div class="kpi"><div class="kpi-value red">${kpis.cancelados}</div><div class="kpi-label">Cancelados</div></div>
          <div class="kpi"><div class="kpi-value">${kpis.pendentes}</div><div class="kpi-label">Pendentes</div></div>
          <div class="kpi"><div class="kpi-value">R$ ${kpis.receita.toFixed(2).replace('.', ',')}</div><div class="kpi-label">Receita estimada</div></div>
        </div>
        <h2>Agendamentos</h2>
        <table>
          <thead>
            <tr><th>Clínica</th><th>Serviço</th><th>Cliente</th><th>Data/Hora</th><th>Status</th><th>Valor</th></tr>
          </thead>
          <tbody>
            ${linhasTabela || '<tr><td colspan="6" style="text-align:center">Nenhum agendamento</td></tr>'}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const gerarPDF = async () => {
    setLoading(true);
    setTipo('pdf');
    try {
      const { agendamentos } = await carregarDados();
      const kpis = calcularKpis(agendamentos);
      const html = buildHtml(agendamentos, kpis);
      await RNPrint.print({ html });
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível gerar o PDF.');
    } finally {
      setLoading(false);
      setTipo(null);
    }
  };

  const gerarExcel = async () => {
    setLoading(true);
    setTipo('excel');
    try {
      const { agendamentos } = await carregarDados();
      const kpis = calcularKpis(agendamentos);

      const wsKpis = XLSX.utils.aoa_to_sheet([
        ['Relatório TaskLink'],
        ['Gerado em', new Date().toLocaleDateString('pt-BR')],
        [],
        ['Total', 'Confirmados', 'Cancelados', 'Pendentes', 'Receita estimada (R$)'],
        [kpis.total, kpis.confirmados, kpis.cancelados, kpis.pendentes, kpis.receita.toFixed(2)],
      ]);

      const linhas = agendamentos.map(a => ([
        a.nomeClinica || '',
        a.nomeServico || '',
        a.nomeCliente || '',
        `${a.data || ''} ${a.hora || ''}`.trim(),
        a.status || '',
        Number(a.preco || 0).toFixed(2),
        `${a.duracao || ''} min`,
      ]));

      const wsAgs = XLSX.utils.aoa_to_sheet([
        ['Clínica', 'Serviço', 'Cliente', 'Data/Hora', 'Status', 'Valor (R$)', 'Duração'],
        ...linhas,
      ]);

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsKpis, 'Resumo');
      XLSX.utils.book_append_sheet(wb, wsAgs, 'Agendamentos');

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      const path = `${RNFS.ExternalDirectoryPath}/relatorio_tasklink_${Date.now()}.xlsx`;
      await RNFS.writeFile(path, wbout, 'base64');

      Alert.alert('✅ Excel gerado!', `Arquivo salvo em:\n${path}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível gerar o Excel.');
    } finally {
      setLoading(false);
      setTipo(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.logoRow}>
          <Text style={commonStyles.logoTask}>Task</Text>
          <Text style={commonStyles.logoLink}>Link</Text>
        </View>
        <Text style={commonStyles.headerSubtitle}>Relatórios</Text>
      </View>

      <ScrollView style={commonStyles.card} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Exportar relatório</Text>
        <View style={commonStyles.divider} />

        <Text style={styles.descricao}>
          Gere um relatório completo com KPIs e lista de agendamentos de todas as suas clínicas.
        </Text>

        <View style={commonStyles.contentCard}>
          <Text style={styles.cardTitle}>📄 PDF</Text>
          <Text style={styles.cardDesc}>Relatório formatado, pronto para imprimir ou salvar como PDF.</Text>
          <TouchableOpacity style={styles.btnExportar} onPress={gerarPDF} disabled={loading}>
            {loading && tipo === 'pdf'
              ? <ActivityIndicator color={colors.primary} />
              : <Text style={styles.btnExportarText}>Exportar PDF</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={commonStyles.contentCard}>
          <Text style={styles.cardTitle}>📊 Excel</Text>
          <Text style={styles.cardDesc}>Planilha com resumo e lista completa de agendamentos.</Text>
          <TouchableOpacity style={styles.btnExportar} onPress={gerarExcel} disabled={loading}>
            {loading && tipo === 'excel'
              ? <ActivityIndicator color={colors.primary} />
              : <Text style={styles.btnExportarText}>Exportar Excel</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.textDark, marginTop: 8 },
  descricao: { color: colors.textBody, fontSize: 14, marginBottom: 16, lineHeight: 20 },
  cardTitle: { fontWeight: 'bold', color: colors.textDark, fontSize: 16, marginBottom: 4 },
  cardDesc: { color: colors.textBody, fontSize: 13, marginBottom: 14 },
  btnExportar: {
    backgroundColor: colors.gold, borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  btnExportarText: { color: colors.primary, fontWeight: 'bold', fontSize: 15 },
});