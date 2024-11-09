const axios = require("axios");

const ERRO_CUPOM_INVALIDO = 0;
const ERRO_VALIDACAO = 1;
class Carrinho {
	constructor() {
		this.itens = [];
	}

	adicionarItem(nome, quantidade, preco) {
		if (typeof nome !== "string" || nome === "") {
			throw new Error("Nome inválido");
		} else if (typeof quantidade !== "number" || quantidade <= 0) {
			throw new Error("Quantidade inválida");
		} else if (typeof preco !== "number" || preco <= 0) {
			throw new Error("Preço inválido");
		}
		this.itens.push({ nome, quantidade, preco });
	}

	removerItem(nome) {
		const index = this.itens.findIndex((item) => item.nome === nome);
		if (index === -1) {
			throw new Error("Item não existe");
		}
		this.itens.splice(index, 1);
	}

	calcularTotal() {
		return this.itens.reduce((acc, item) => {
			return acc + item.preco * item.quantidade;
		}, 0);
	}

	async aplicarCupomPercentual(codigo) {
		const resposta = await this.validarCupom(codigo, "percentual");

		if (resposta === ERRO_CUPOM_INVALIDO) {
			throw new Error("Cupom inválido");
		}
		if (resposta === ERRO_VALIDACAO) {
			throw new Error("Erro ao validar cupom");
		}
		return (this.calcularTotal() * (100 - resposta)) / 100;
	}

	async aplicarCupomValorFixo(codigo) {
		const resposta = await this.validarCupom(codigo, "fixo");
		if (resposta === ERRO_CUPOM_INVALIDO) {
			throw new Error("Cupom inválido");
		}
		if (resposta === ERRO_VALIDACAO) {
			throw new Error("Erro ao validar cupom");
		}
		const resultado = this.calcularTotal() - resposta;
		return resultado >= 0 ? resultado : 0;
	}

	async validarCupom(codigo, tipo) {
		try {
			const resposta = await axios.get(`http://localhost:3000/${codigo}`);

			if (resposta.data.mensagem || resposta.data.tipo !== tipo) {
				return ERRO_CUPOM_INVALIDO;
			}
			return resposta.data.desconto;
		} catch (error) {
			return ERRO_VALIDACAO;
		}
	}

	listarItens() {
		return this.itens;
	}
}

module.exports = { Carrinho, ERRO_CUPOM_INVALIDO, ERRO_VALIDACAO };
