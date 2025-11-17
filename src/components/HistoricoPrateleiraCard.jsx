// src/components/HistoricoPrateleiraCard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HistoricoPrateleiraCard.css";
import authFetch, { getToken } from "../utils/authFetch"; // certifique-se de ter authFetch com onUnauthorized

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
  const navigate = useNavigate();

  // Função para buscar os dados do histórico
  const fetchHistorico = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await authFetch(
        "https://two025-estok-backend.onrender.com/api/estok/product/get-history",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_AUTH_KEY || "",
          },
        },
        {
          onUnauthorized: () => navigate("/login", { replace: true }),
        }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setError("Sessão expirada. Faça login novamente.");
          return;
        } else if (res.status === 500) {
          setError("Erro no servidor. Tente novamente mais tarde.");
          return;
        } else {
          const errBody = await res.json().catch(() => null);
          setError(errBody?.message || "Erro ao carregar o histórico.");
          return;
        }
      }

      const data = await res.json();

      // Se data não for array, tenta pegar propriedade adequada
      const list = Array.isArray(data) ? data : (Array.isArray(data.result) ? data.result : []);

      // Mapeia os dados da API para o formato esperado pelo componente
      const movimentosFormatados = list.map((item) => ({
        id: item.id ?? `${item.nome_produto ?? "p"}-${Math.random().toString(36).slice(2, 8)}`,
        produto: item.nome_produto ?? item.produto ?? "-",
        tipo: (item.nome_status === "entrou" || item.nome_status === "entrada") ? "entrada" : "saida",
        categoria: item.nome_tipo ?? item.tipo ?? "-",
        marca: item.nome_marca ?? item.marca ?? "-",
        // tenta usar imagem por produto na pasta public, se não tiver, fallback
        imagem: item.imagem ? item.imagem : `/${(item.nome_produto || "default").replace(/\s+/g, "")}.png`,
        quantidade: item.quantidade ?? item.qtd ?? 0,
        validade: item.validade ? new Date(item.validade).toLocaleDateString("pt-BR") : "-",
      }));

      setMovimentos(movimentosFormatados);
    } catch (err) {
      console.error("Erro ao carregar o histórico:", err);
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // useEffect para carregar histórico na montagem do componente e abrir WebSocket
  useEffect(() => {
    let mounted = true;
    fetchHistorico();

    // configura URL do websocket incluindo token/apiKey se disponível
    const apiKey = import.meta.env.VITE_AUTH_KEY || "";
    const token = getToken();
    const params = new URLSearchParams();
    if (apiKey) params.append("x-api-key", apiKey);
    if (token) params.append("token", token);
    const wsUrl = `wss://two025-estok-backend.onrender.com${params.toString() ? `?${params.toString()}` : ""}`;

    let socket;
    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        // console.log("WS conectado", wsUrl);
      };

      socket.onmessage = (ev) => {
        // Quando receber mensagem, atualiza histórico (se ainda montado)
        if (!mounted) return;
        // Pode validar ev.data se quiser; aqui simplesmente refaz a busca
        fetchHistorico();
      };

      socket.onerror = (e) => {
        // erro no socket não impede a ui; log para debug
        console.warn("WebSocket error:", e);
      };
    } catch (e) {
      console.warn("Falha ao inicializar WebSocket:", e);
    }

    return () => {
      mounted = false;
      if (socket && socket.readyState === WebSocket.OPEN) socket.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

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
                  onError={(e) => (e.target.src = "/default.png")}
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
