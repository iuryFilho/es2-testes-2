const {
	Carrinho,
	ERRO_CUPOM_INVALIDO,
	ERRO_VALIDACAO,
} = require("../src/carrinho");
const axios = require("axios");
jest.mock("axios");

describe("adicionar", () => {
	it("valores válidos", () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		expect(carrinho.itens.pop()).toStrictEqual({
			nome: "camisa",
			quantidade: 1,
			preco: 100,
		});
	});

	it("nome não é string", () => {
		const carrinho = new Carrinho();
		expect(() => carrinho.adicionarItem(1, 1, 100)).toThrow(
			"Nome inválido"
		);
	});

	it("nome vazio", () => {
		const carrinho = new Carrinho();
		expect(() => carrinho.adicionarItem("", 1, 100)).toThrow(
			"Nome inválido"
		);
	});

	it("quantidade não é número", () => {
		const carrinho = new Carrinho();
		expect(() => carrinho.adicionarItem("camisa", "1", 100)).toThrow(
			"Quantidade inválida"
		);
	});

	it("quantidade <= 0", () => {
		const carrinho = new Carrinho();
		expect(() => carrinho.adicionarItem("camisa", 0, 100)).toThrow(
			"Quantidade inválida"
		);
	});

	it("preço não é número", () => {
		const carrinho = new Carrinho();
		expect(() => carrinho.adicionarItem("camisa", 1, "100")).toThrow(
			"Preço inválido"
		);
	});

	it("preço <= 0", () => {
		const carrinho = new Carrinho();
		expect(() => carrinho.adicionarItem("camisa", 1, 0)).toThrow(
			"Preço inválido"
		);
	});
});

describe("remover", () => {
	it("item existe", () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.removerItem("camisa");
		expect(carrinho.itens.length).toBe(0);
	});

	it("item não existe", () => {
		const carrinho = new Carrinho();
		expect(() => carrinho.removerItem("camisa")).toThrow("Item não existe");
	});
});

describe("calcular total", () => {
	it("carrinho vazio", () => {
		const carrinho = new Carrinho();
		expect(carrinho.calcularTotal()).toBe(0);
	});

	it("2 itens no carrinho", () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.adicionarItem("meia", 2, 20);
		expect(carrinho.calcularTotal()).toBe(140);
	});
});

describe("validar cupom", () => {
	it("cupom válido tipo percentual", async () => {
		const carrinho = new Carrinho();
		axios.get.mockResolvedValue({
			data: { desconto: 10, tipo: "percentual" },
		});
		const resposta = await carrinho.validarCupom("CUPOM10P", "percentual");
		expect(resposta).toBe(10);
	});

	it("cupom válido tipo fixo", async () => {
		const carrinho = new Carrinho();
		axios.get.mockResolvedValue({
			data: { desconto: 15, tipo: "fixo" },
		});
		const resposta = await carrinho.validarCupom("CUPOM15", "fixo");
		expect(resposta).toBe(15);
	});

	it("cupom inválido", async () => {
		const carrinho = new Carrinho();
		axios.get.mockResolvedValue({
			data: { mensagem: "Cupom inválido" },
		});
		const resposta = await carrinho.validarCupom("CUPOM10", "percentual");
		expect(resposta).toBe(ERRO_CUPOM_INVALIDO);
	});

	it("tipo de cupom diferente", async () => {
		const carrinho = new Carrinho();
		axios.get.mockResolvedValue({
			data: { desconto: 10, tipo: "percentual" },
		});
		const resposta = await carrinho.validarCupom("CUPOM10P", "fixo");
		expect(resposta).toBe(ERRO_CUPOM_INVALIDO);
	});

	it("erro ao validar cupom", async () => {
		const carrinho = new Carrinho();
		axios.get.mockRejectedValue(new Error("Erro na validação"));
		const resposta = await carrinho.validarCupom("CUPOM10P", "percentual");
		expect(resposta).toBe(ERRO_VALIDACAO);
	});
});

describe("aplicar cupom percentual", () => {
	it("cupom válido", async () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.adicionarItem("meia", 2, 20);
		axios.get.mockResolvedValue({
			data: { desconto: 10, tipo: "percentual" },
		});
		const resposta = await carrinho.aplicarCupomPercentual("CUPOM10P");
		expect(resposta).toBe(126);
	});

	it("cupom inválido", async () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.adicionarItem("meia", 2, 20);
		axios.get.mockResolvedValue({
			data: { mensagem: "Cupom inválido" },
		});
		await expect(
			carrinho.aplicarCupomPercentual("CUPOM10")
		).rejects.toThrow("Cupom inválido");
	});

	it("erro ao validar cupom", async () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.adicionarItem("meia", 2, 20);
		axios.get.mockRejectedValue(new Error("Erro na validação"));
		await expect(carrinho.aplicarCupomPercentual("%")).rejects.toThrow(
			"Erro ao validar cupom"
		);
	});
});

describe("aplicar cupom valor fixo", () => {
	it("desconto <= valor total", async () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.adicionarItem("meia", 2, 20);
		axios.get.mockResolvedValue({
			data: { desconto: 15, tipo: "fixo" },
		});
		const resposta = await carrinho.aplicarCupomValorFixo("CUPOM15");
		expect(resposta).toBe(125);
	});

	it("desconto > valor total", async () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("caneta", 1, 5);
		axios.get.mockResolvedValue({
			data: { desconto: 15, tipo: "fixo" },
		});
		const resposta = await carrinho.aplicarCupomValorFixo("CUPOM15");
		expect(resposta).toBe(0);
	});

	it("cupom inválido", async () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.adicionarItem("meia", 2, 20);
		axios.get.mockResolvedValue({
			data: { mensagem: "Cupom inválido" },
		});
		await expect(carrinho.aplicarCupomValorFixo("CUPOM10")).rejects.toThrow(
			"Cupom inválido"
		);
	});

	it("erro ao validar cupom", async () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.adicionarItem("meia", 2, 20);
		axios.get.mockRejectedValue(new Error("Erro na validação"));
		await expect(carrinho.aplicarCupomValorFixo("%")).rejects.toThrow(
			"Erro ao validar cupom"
		);
	});
});

describe("listar", () => {
	it("2 itens no carrinho", () => {
		const carrinho = new Carrinho();
		carrinho.adicionarItem("camisa", 1, 100);
		carrinho.adicionarItem("meia", 2, 20);
		expect(carrinho.listarItens()).toStrictEqual([
			{ nome: "camisa", quantidade: 1, preco: 100 },
			{ nome: "meia", quantidade: 2, preco: 20 },
		]);
	});
});
