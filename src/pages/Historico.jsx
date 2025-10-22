import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Historico.css";
import Footer from "../components/Footer";

const PAGE_SIZE = 4;

const Historico = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("recentes");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função para buscar dados do backend
  const fetchHistorico = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        "https://two025-estok-backend.onrender.com/api/estok/product/get-history",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_AUTH_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      // Mapear a resposta para o formato esperado no front
      const mappedData = json.map((item) => ({
        id: item.id,
        nome: item.nome_produto,
        tipo: item.nome_tipo,
        marca: item.nome_marca,
        validade: item.validade?.split("T")[0] || "",
        status: item.nome_status === "entrou" ? "entrada" : "saida",
        horario: item.horario_alteracao?.split("T")[1]?.split(".")[0] || "",
        imagem: "../public/Leite.png", // aqui pode mapear dinamicamente se quiser
        quantidade: item.quantidade,
      }));

      setData(mappedData);
      setPage(1); // reset page
    } catch (err) {
      setError(err.message || "Erro ao buscar histórico");
    } finally {
      setLoading(false);
    }
  };

  // Busca ao montar e sempre que receber notificação WS (não implementado aqui)
  useEffect(() => {
    fetchHistorico();
  }, []);

  // Filtragem atualizada para os novos campos
  const filtered = data.filter(
    (item) =>
      item.nome.toLowerCase().includes(search.toLowerCase()) ||
      item.tipo.toLowerCase().includes(search.toLowerCase()) ||
      item.marca.toLowerCase().includes(search.toLowerCase()) ||
      item.validade.includes(search) ||
      item.status.toLowerCase().includes(search.toLowerCase()) ||
      item.horario.includes(search)
  );

  // Ordenação
  const sorted = [...filtered].sort((a, b) => {
    if (order === "recentes") return b.id - a.id;
    return a.id - b.id;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const startIdx = (page - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const pageData = sorted.slice(startIdx, endIdx);

  // Atualiza página ao buscar/ordenar
  useEffect(() => {
    setPage(1);
  }, [search, order]);

  function formatValidade(dataStr) {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}-${mes}-${ano}`;
  }

  // Paginação com setas e reticências
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];

    pages.push(
      <button
        key={1}
        className={`historico-page-btn${page === 1 ? " active" : ""}`}
        onClick={() => setPage(1)}
      >
        1
      </button>
    );

    if (page > 3) {
      pages.push(
        <span key="start-ellipsis" className="ellipsis">
          ...
        </span>
      );
    }

    if (page > 2) {
      pages.push(
        <button
          key={page - 1}
          className="historico-page-btn"
          onClick={() => setPage(page - 1)}
        >
          {page - 1}
        </button>
      );
    }

    if (page !== 1 && page !== totalPages) {
      pages.push(
        <button
          key={page}
          className="historico-page-btn active"
          onClick={() => setPage(page)}
        >
          {page}
        </button>
      );
    }

    if (page < totalPages - 1) {
      pages.push(
        <button
          key={page + 1}
          className="historico-page-btn"
          onClick={() => setPage(page + 1)}
        >
          {page + 1}
        </button>
      );
    }

    if (page < totalPages - 2) {
      pages.push(
        <span key="end-ellipsis" className="ellipsis">
          ...
        </span>
      );
    }

    if (totalPages > 1) {
      pages.push(
        <button
          key={totalPages}
          className={`historico-page-btn${page === totalPages ? " active" : ""}`}
          onClick={() => setPage(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    return (
      <div className="historico-pagination">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="historico-page-btn arrow-btn"
          title="Página anterior"
        >
          &#8592;
        </button>

        {pages}

        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          className="historico-page-btn arrow-btn"
          title="Próxima página"
        >
          &#8594;
        </button>
      </div>
    );
  };

  return (
    <div className="container">
      <Sidebar />
      <main>
        <div className="historico-header">
          <h2 className="historico-title">Histórico de Movimentações</h2>
          <div className="historico-actions">
            <input
              type="text"
              className="historico-search"
              placeholder="Buscar informações"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="historico-order"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigos">Mais antigos</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p>Carregando histórico...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="historico-table-container">
            <table className="historico-table">
              <thead>
                <tr>
                  <th className="produto-col">Produto</th>
                  <th className="tipo-col">Tipo</th>
                  <th className="marca-col">Marca</th>
                  <th className="validade-col">Validade</th>
                  <th className="quantidade-col">Qtde</th>
                  <th className="status-col">Status</th>
                  <th className="horario-col">Horário</th>
                </tr>
              </thead>
              <tbody>
                {pageData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="historico-empty">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  pageData.map((item) => (
                    <tr key={item.id}>
                      <td className="produto-cell">
                        <div className="produto-cell-content">
                          <img
                            src={item.imagem}
                            alt={item.nome}
                            className="produto-miniatura"
                          />
                          <span className="produto-nome">{item.nome}</span>
                        </div>
                      </td>
                      <td className="tipo-cell">{item.tipo}</td>
                      <td className="marca-cell">{item.marca}</td>
                      <td className="validade-cell">{formatValidade(item.validade)}</td>
                      <td className="quantidade-cell">
                        <span className="quantidade-destaque">{item.quantidade}</span>
                      </td>
                      <td className="status-cell">
                        <span
                          className={`historico-arrow-icon ${
                            item.status === "saida" ? "saida" : "entrada"
                          }`}
                          title={item.status === "saida" ? "Saída" : "Entrada"}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "1.5rem",
                            verticalAlign: "middle",
                          }}
                        >
                          <span className="material-icons-sharp">
                            {item.status === "saida"
                              ? "arrow_outward"
                              : "arrow_downward"}
                          </span>
                          <span style={{ fontSize: "1rem", fontWeight: 600 }}>
                            {item.status === "saida" ? "Saída" : "Entrada"}
                          </span>
                        </span>
                      </td>
                      <td className="horario-cell">{item.horario}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {renderPagination()}
          </div>
        )}
      </main>

      {/* ===== Modal ===== */}
      {modalItem && (
        <div className="modal-overlay" onClick={() => setModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Detalhes do Produto</h3>
            <img
              src={modalItem.imagem}
              alt={modalItem.nome}
              className="modal-imagem"
            />
            <p><strong>Tipo:</strong> {modalItem.tipo}</p>
             <p><strong>Horário:</strong> {modalItem.horario}</p>
            <p><strong>Marca:</strong> {modalItem.marca}</p>
            <p><strong>Validade:</strong> {formatValidade(modalItem.validade)}</p>
            <button className="modal-fechar" onClick={() => setModalItem(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
    
  );
  
};

export default Historico;
