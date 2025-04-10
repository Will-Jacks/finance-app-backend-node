const mqtt = require('mqtt');
const axios = require('axios');

//Api WPP
const { clientWpp, number } = require('./botWhats');

//--------------------------!Para o futuro!-------------------------------//
//Implementar uma lógica para que ao não obter sucesso conectando-se à um broker mqtt, tentar se conectar à outra URL
//const brokerUrl = "mqtt://test.mosquitto.org:1883";
const brokerUrl = "wss://broker.emqx.io:8084/mqtt";
const generalTopic = "finance-bills-app";//-localhost-broker";
const getTopic = `${generalTopic}-get`;
const postTopic = `${generalTopic}-post`;
const deleteTopic = `${generalTopic}-delete`;

const backendBaseUrl = "http://10.0.0.151:8080";

const client = mqtt.connect(brokerUrl);

let nRequisicoes = 0;

client.on("connect", () => {
    console.log("Cliente conectado com sucesso!");
});

client.subscribe(generalTopic);
client.subscribe(getTopic);
client.subscribe(postTopic);
client.subscribe(deleteTopic);
client.subscribe(`${generalTopic}-filtro-comprador`);
client.subscribe(`${generalTopic}-filtro-banco`);
client.subscribe(`${generalTopic}-filtro-comprador-banco`);
client.subscribe(`${generalTopic}-filtro-allbanks`); // Esse aqui vai retornar o total de valor dos bancos de cada um dos users
client.subscribe(`${generalTopic}-generalBills-getData`);
client.on("message", async (topic, payload) => {
    const data = payload.toString();

    // !-------------------------------------- GET !--------------------------------------  //
    if (data == "fetchUrl") {
        console.log("Alguém solicitou contas gerais!");
        const response = await axios.get(`${backendBaseUrl}/conta/all`);
        const apiData = await response.data;
        client.publish(generalTopic, JSON.stringify(apiData));

    }

    if (data == "parcial-bills") {
        try {
            const response = await axios.get(`${backendBaseUrl}/conta/parcial-bills`);
            const apiData = await response.data;
            client.publish(generalTopic, JSON.stringify(apiData));
            console.log(`N° de acessos: ${nRequisicoes += 1}`);
        } catch (e) {
            console.log("Erro de conexão com o servidor");
        }
    }

    if (topic == `${generalTopic}-filtro-comprador`) {
        const response = await axios.get(`${backendBaseUrl}/conta/comprador?comprador=${data}`);
        const apiData = await response.data;
        client.publish(generalTopic, JSON.stringify(apiData));
        console.log(`Alguém utilizou o filtro de compras: ${data}`);
    }

    if (topic == `${generalTopic}-filtro-banco`) {
        const response = await axios.get(`${backendBaseUrl}/conta/banco?banco=${data}`);
        const apiData = await response.data;
        client.publish(generalTopic, JSON.stringify(apiData));
        console.log(`Alguém está filtrando por: ${data}`);
    }

    if (topic == `${generalTopic}-generalBills-getData`) {
        const response = await axios.get(`${backendBaseUrl}/conta/getallbanks`);
        const apiData = await response.data;
        client.publish(`${generalTopic}-generalBills`, JSON.stringify(apiData));
        console.log("Alguém acessou o GeneralBills");
    }

    if (topic == `${generalTopic}-filtro-comprador-banco`) {
        const formattedData = JSON.parse(data);
        try {
            const response = await axios.get(`${backendBaseUrl}/conta/filter`, {
                params: {
                    comprador: formattedData.comprador,
                    banco: formattedData.banco
                }
            });
            const apiData = await response.data;
            client.publish(`${generalTopic}`, JSON.stringify(apiData));
            console.log(`Alguém tá usando o filtro comprador-banco: ${data}`);
        } catch (e) {
            console.error(e);
        }
    }

    // !-------------------------------------- POST !--------------------------------------  //
    if (topic == postTopic) {
        try {
            axios.post(`${backendBaseUrl}/conta/save`, JSON.parse(data));
        } catch (e) {
            console.error(e);
        }
        console.log("Foi cadastrado uma nova bill!");
        const jsonData = JSON.parse(data);
        clientWpp.sendMessage(number, `Foi criado uma nova conta: \n${jsonData.titulo}\nR$ ${jsonData.valor}\n${jsonData.comprador}\n${jsonData.categoria}`);
    }

    // !-------------------------------------- DELETE !--------------------------------------  //
    if (topic == deleteTopic) {
        console.log("Alguém deletou uma bill!");
        axios.delete(`${backendBaseUrl}/conta/delete/${data}`);
    }

});