import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import Card from "../Card/Card";
import { HistoricoPrateleiraCard } from "../HistoricoPrateleiraCard";
import ProdutosModal from "./ProdutosModal";
import "./Dashboard.css";

const modalTitles = {
  reposicao: "Produtos precisando de reposição",
  criticos: "Produtos com nível crítico de estoque",
  vencidos: "Produtos próximos do vencimento",
};

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(null);
  const [stockData, setStockData] = useState({
    lowStock: [],
    mediumStock: [],
    highStock: [],
    expired: [],
  });
  const [loading, setLoading] = useState(true);

  // 🔹 Busca os dados da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://two025-estok-backend.onrender.com/api/estok/product/get-product-status",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": import.meta.env.VITE_AUTH_KEY,
            },
          }
        );

        if (!response.ok) throw new Error("Erro ao buscar dados do estoque");

        const data = await response.json();

        // 🔹 Formata os dados (adiciona um id e ajusta validade)
        const format = (list) =>
          list.map((p, index) => ({
            id: index + 1,
            produto: p.produto,
            tipo: p.tipo,
            marca: p.marca,
            qtd_max: p.qtd_max,
            qtd_atual: p.qtd_atual,
            validade: p.validade
              ? new Date(p.validade).toLocaleDateString("pt-BR")
              : "-",
          }));

        setStockData({
          lowStock: format(data.lowStock || []),
          mediumStock: format(data.mediumStock || []),
          highStock: format(data.highStock || []),
          expired: format(data.expired || []),
        });
      } catch (error) {
        console.error("Erro ao buscar produtos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 Define os produtos que vão pro modal
  let modalProdutos = [];
  if (modalOpen === "reposicao") modalProdutos = stockData.mediumStock;
  if (modalOpen === "criticos") modalProdutos = stockData.lowStock;
  if (modalOpen === "vencidos") modalProdutos = stockData.expired;

  if (loading) {
    return (
      <div className="container">
        <Sidebar />
        <main>
          <h2>Dashboard</h2>
          <p>Carregando dados do estoque...</p>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <Sidebar />
        <main>
          <h2>Dashboard</h2>
          <div className="insights">
            <Card
              icon="two_pager_store"
              value={stockData.mediumStock.length}
              title="Produtos precisando de reposição"
              buttonLabel="Ver produtos"
              className="reposicao"
              onButtonClick={() => setModalOpen("reposicao")}
            />
            <Card
              icon="two_pager_store"
              value={stockData.lowStock.length}
              title="Produtos com nível crítico de estoque"
              buttonLabel="Ver produtos"
              className="atencao"
              onButtonClick={() => setModalOpen("criticos")}
            />
            <Card
              icon="two_pager_store"
              value={stockData.expired.length}
              title="Produtos próximos do vencimento"
              buttonLabel="Ver validade"
              className="vencimento"
              onButtonClick={() => setModalOpen("vencidos")}
            />
          </div>

          <div className="mt-8 historico-margin-top">
            <h2 className="mb-4 font-bold text-lg">
              Histórico de Movimentações
            </h2>
            <HistoricoPrateleiraCard />
          </div>
          
        </main>
        
      </div>

      <ProdutosModal
        open={!!modalOpen}
        onClose={() => setModalOpen(null)}
        title={modalTitles[modalOpen]}
        produtos={modalProdutos}
        tipo={modalOpen}
      />
    </>
  );
};

export default Dashboard;
