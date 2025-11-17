import React from "react";
import "./ProdutosModal.css";

const ProdutosModal = ({ open, onClose, title, produtos = [] }) => {
  if (!open) return null;

  return (
    <div className="produtos-modal-overlay">
      <div className="produtos-modal">
        <button className="produtos-modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="produtos-modal-title">{title}</h2>
        <div className="produtos-modal-list">
          {produtos.length === 0 ? (
            <div className="produtos-modal-empty">
              Nenhum produto encontrado.
            </div>
          ) : (
            produtos.map((p) => (
              <div key={p.id} className="produtos-modal-card">
                <div className="produtos-modal-nome">
                  {p.produto} ({p.tipo})
                </div>
                <div className="produtos-modal-info">
                  <p><strong>Marca:</strong> {p.marca}</p>
                  <p>
                    <strong>Quantidade:</strong> {p.qtd_atual} / {p.qtd_max}
                  </p>
                  <p>
                    <strong>Validade:</strong> {p.validade}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ProdutosModal;
