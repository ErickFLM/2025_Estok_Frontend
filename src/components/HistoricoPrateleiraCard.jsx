import React, { useEffect, useState } from "react";
import "./HistoricoPrateleiraCard.css";

// Skeleton loader para os cards
export const MovimentoSkeleton = () => (
  <div className="historico-card movimento-skeleton">
    <div className="historico-img-skeleton" />
    <div className="historico-info-skeleton">
      <div className="historico-line-skeleton short" />
      <div className="historico-line-skeleton medium" />
      <div className="historico-line-skeleton long" />
    </div>
    <div className="historico-arrow-skeleton" />
  </div>
);

// Card de histórico de prateleira
export const HistoricoPrateleiraCard = () => {
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para buscar os dados do histórico
  const fetchHistorico = async () => {
    try {
      setLoading(true);
      setError(null);

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
        throw new Error("Erro ao carregar os dados do histórico");
      }

      const data = await response.json();

      // Mapeia os dados da API para o formato esperado pelo componente
      const movimentosFormatados = data.map((item) => ({
        id: item.id,
        produto: item.nome_produto,
        tipo: item.nome_status === "entrou" ? "entrada" : "saida",
        categoria: item.nome_tipo,
        marca: item.nome_marca,
        imagem: "../public/Leite.png", // Ajuste conforme necessário
        quantidade: item.quantidade,
        validade: item.validade,
      }));

      setMovimentos(movimentosFormatados);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // useEffect para carregar histórico na montagem do componente
  useEffect(() => {
    fetchHistorico();

    // Exemplo WebSocket para atualizar dados em tempo real
    const socket = new WebSocket("wss://two025-estok-backend.onrender.com");

    socket.onmessage = () => {
      fetchHistorico();
    };

    return () => {
      socket.close();
    };
  }, []);

  if (loading) {
    return (
      <div className="historico-scroll-container">
        <div className="historico-list">
          <MovimentoSkeleton />
          <MovimentoSkeleton />
          <MovimentoSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="historico-card historico-card-empty">
        Erro ao carregar o histórico: {error}
      </div>
    );
  }

  return (
    <div className="historico-scroll-container">
      <div className="historico-list">
        {movimentos.length === 0 ? (
          <div className="historico-card historico-card-empty">
            Nenhuma movimentação encontrada
          </div>
        ) : (
          movimentos.map((mov) => {
            const isSaida = mov.tipo === "saida";
            return (
              <div key={mov.id} className="historico-card">
                <img
                  src={mov.imagem}
                  alt={mov.produto}
                  className="historico-img"
                />
                <div className="historico-info">
                  <span className="historico-produto">{mov.produto}</span>
                  <span className="historico-categoria-marca">
                    {mov.categoria} &middot; {mov.marca}
                  </span>
                </div>
                <div className="historico-arrow">
                  <span
                    className={`material-icons-sharp historico-arrow-icon ${
                      isSaida ? "saida" : "entrada"
                    }`}
                  >
                    {isSaida ? "arrow_downward" : "arrow_upward"}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
