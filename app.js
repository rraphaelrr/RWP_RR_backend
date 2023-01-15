const connection = require('./dba');

connection.connect(function (err) {
    if (err) {
        console.error('Erro ao conectar: ' + err.stack);
        return;
    }
    console.log('Conexão estabelecida com o banco de dados.');
});

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const cors = require('cors');

app.use(cors());

/* Pegar permissoes */
app.get('/permissoes', (req, res) => {
    let sql = 'SELECT * FROM permissoes'
    connection.query(sql, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})

/* Criação de usuario */
app.post('/criarUsuario', (req, res) => {
    // validate request
    if (!req.body.nome || !req.body.email || !req.body.senha || !req.body.documento || !req.body.id_permissao || !req.body.tipoConta) {
        return res.status(400).send({ error: true, message: 'Por favor preencha os campos obrigadorios' });
    }

    // save user to database
    const user = {
        nome: req.body.nome,
        email: req.body.email,
        senha: req.body.senha,
        documento: req.body.documento,
        id_permissao: req.body.id_permissao,
        tipoConta: req.body.tipoConta,
        telefone: req.body.telefone ? req.body.telefone : null
    };
    connection.query('INSERT INTO usuarios SET ?', user, (err, result) => {
        if (err) throw err;
        res.send({ error: false, data: result, message: 'Usuario criado com sucesso!' });
    });
});

/* Verificar se usuario existe */
app.post('/verificarUsuario', (req, res) => {
    const documento = req.body.documento;
    const senha = req.body.senha;
    connection.query(`SELECT COUNT(*) as count FROM usuarios WHERE documento = '${documento}' and senha = '${senha}'`, (err, result) => {
        if (err) throw err;
        if (result[0].count === 1) {
            return res.status(200).send({ error: false, data: 1 });
        }
        res.status(401).send({ error: true, data: 0 });
    });
});


/* Pegar clientes */
app.get('/clientes', (req, res) => {
    connection.query('SELECT * FROM usuarios WHERE id_permissao = 5', (err, rows) => {
        if(err) throw err;
        if(rows.length === 0) {
            return res.status(404).send({ error: true, message: 'Não existem usuários com id_permissao igual a 5' });
        }
        res.send({ error: false, data: rows });
    });
});

/* Criar Pedido */
app.post('/addpedido', (req, res) => {
    const id_usuario = req.body.id_usuario;
    const quantBruta = req.body.quantBruta;
    const endereco = req.body.endereco;
    const nomeDestino = req.body.nomeDestino;
    const dataPedido = req.body.dataPedido;
    const dataPrevista = req.body.dataPrevista;
    const etapaPedido = req.body.etapaPedido;
    connection.query('SELECT * FROM usuarios WHERE id = ?', [id_usuario], (err, rows) => {
        if(err) throw err;
        if(rows.length === 0) {
            return res.status(404).send({ error: true, message: 'Usuário não encontrado' });
        }
        connection.query('INSERT INTO pedidos (id_usuario, quantBruta, endereco, nomeDestino, dataPedido, dataPrevista, etapaPedido) VALUES(?,?,?,?,?,?,?)', [id_usuario, quantBruta, endereco, nomeDestino, dataPedido, dataPrevista, etapaPedido], (err, result) => {
            if(err) throw err;
            res.send({ error: false, data: result, message: 'Pedido adicionado com sucesso.' });
        });
    });
});



/* Alterar Etapa pedido */
app.put('/updatepedido/', (req, res) => {
    const id = req.body.id;
    const etapaPedido = req.body.etapaPedido;
    const dataPrevista = req.body.dataPrevista;
    connection.query('UPDATE pedidos SET etapaPedido = ?, dataPrevista = ? WHERE id = ?', [etapaPedido, dataPrevista, id], (err, result) => {
        if (err) throw err;
        if (result.affectedRows === 0) {
            return res.status(404).send({ error: true, message: 'Pedido não encontrado' });
        }
        res.send({ error: false, data: result, message: 'Etapa e data prevista do pedido atualizado com sucesso.' });
    });
});


/* pegar pedidos pelo usuario */
app.get('/pedidos/:id_usuario', (req, res) => {
    const id_usuario = req.params.id_usuario;
    connection.query('SELECT * FROM pedidos WHERE id_usuario = ?', [id_usuario], (err, rows) => {
        if(err) throw err;
        if(rows.length === 0) {
            return res.status(404).send({ error: true, message: 'Não existem pedidos para esse usuário' });
        }
        res.send({ error: false, data: rows });
    });
});



  


app.listen(5000, function () {
    console.log('Aplicação rodando na porta 3000.');
});