const cupons = require("./data/cupons.json");
const express = require("express");
const router = express.Router();
const app = express();
const port = 3000;

router.get("/:codigo", (req, res) => {
	const codigo = req.params.codigo;
	const cupom = cupons.find((cupom) => cupom.codigo === codigo);
	if (cupom) {
		res.send({ tipo: cupom.tipo, desconto: cupom.desconto });
	} else {
		res.send({ mensagem: "Código do cupom inválido" });
	}
});

app.use("/", router);

if (require.main === module) {
	app.listen(port);
	console.log("API funcionando!");
	console.log(`http://localhost:${port}`);
}

module.exports = app;
