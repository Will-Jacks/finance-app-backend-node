const mqtt = require('mqtt');
const axios = require('axios');

const brokerUrl = "mqtt://test.mosquitto.org:1883";
const generalTopic = "finance-bills-app-localhost-broker";
const getTopic = `${generalTopic}-get`;
const postTopic = `${generalTopic}-post`;
const deleteTopic = `${generalTopic}-delete`;

const backendBaseUrl = "http://10.0.0.151:8080";

const client = mqtt.connect(brokerUrl);

const nRequisicoes = 0;

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

client.on("message", async (topic, payload) => {
    const data = payload.toString();

    //Vai fazer com que acesse o backend e envie os dados para o frontend processar
    if (data == "fetchUrl") {
        console.log("Getado com sucesso!");
        const response = await axios.get(`${backendBaseUrl}/conta/all`);
        const apiData = await response.data;
        client.publish(generalTopic, JSON.stringify(apiData));

    }

    else if (data == "parcial-bills") {
        try{
            const response = await axios.get(`${backendBaseUrl}/conta/parcial-bills`);
            const apiData = await response.data;
            client.publish(generalTopic, JSON.stringify(apiData));
            console.log("Parcials bills");
        }catch(e) {
            console.log("Erro de conexão com o servidor");
        }


    }
    if(topic == `${generalTopic}-filtro-comprador`) {
        const response = await axios.get(`${backendBaseUrl}/conta/comprador?comprador=${data}`);
        const apiData = await response.data;
        client.publish(generalTopic, JSON.stringify(apiData));
    }

    if(topic == `${generalTopic}-filtro-banco`) {
        const response = await axios.get(`${backendBaseUrl}/conta/banco?banco=${data}`);
        const apiData = await response.data;
        client.publish(generalTopic, JSON.stringify(apiData));
        console.log(`Filtrando por ${data}`);
    }

    if(topic == `${generalTopic}-filtro-comprador-banco`) {
        const formattedData = JSON.parse(data);
        try {
            const response = await axios.get("http://10.0.0.151:8080/conta/filter", {
                params: {
                    comprador: formattedData.comprador,
                    banco: formattedData.banco
                }
            });
            //console.log(`${backendBaseUrl}/conta/filter?comprador=${formattedData.comprador}&banco=${formattedData.banco}`)
            const apiData = await response.data;
            client.publish(`${generalTopic}`, JSON.stringify(apiData));
        }catch(e) {
            console.error(e);
        }
    }

    if (topic == postTopic) {
        try{
            axios.post(`${backendBaseUrl}/conta/save`, JSON.parse(data));
        }catch(e) {
            console.error(e);
        }
        console.log("Postado com sucesso!");
    }

    if (topic == deleteTopic) {
        console.log("Deletado com sucesso!");
        axios.delete(`${backendBaseUrl}/conta/delete/${data}`);
    }

});