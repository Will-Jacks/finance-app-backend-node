const mqtt = require('mqtt');
const axios = require('axios');

//Api WPP
const { clientWpp, number, isClientReady } = require('./botWhats');
/* const brokerUrl = "mqtt://test.mosquitto.org:1883"; */

const backendBaseUrl = "http://192.168.0.11:8080";

const brokerUrl = "wss://broker.emqx.io:8084/mqtt";
const generalTopic = "finance-bills-app-localhost-broker";

const postTopic = `${generalTopic}-post`;
const putTopic = `${generalTopic}-put`;
const deleteTopic = `${generalTopic}-delete`;
const client = mqtt.connect(brokerUrl);

let nRequisicoes = 0;

client.on("connect", () => {
    console.log("MQTT online!");
});

client.subscribe(`${generalTopic}-all`);
client.subscribe(`${generalTopic}-parcial-bills`);
client.subscribe(`${generalTopic}-summary`);
client.subscribe(`${generalTopic}-paids`);
client.subscribe(`${generalTopic}-somatotal&home`);
client.subscribe(`${generalTopic}-isPaid`);
client.subscribe(`${generalTopic}-post-ganhos-trigger`);
client.subscribe(`${generalTopic}-get-month-income`);

client.subscribe(postTopic);
client.subscribe(putTopic);
client.subscribe(deleteTopic);



client.on("message", async (topic, payload) => {
    const data = payload.toString();

    // !-------------------------------------- GET !--------------------------------------  //
    if (topic == `${generalTopic}-all`) {
        try {
            const response = await axios.get(`${backendBaseUrl}/bill/all`);
            const apiData = await response.data;
            client.publish(generalTopic, JSON.stringify(apiData));
        } catch (e) {
            console.error(e);
        }

        console.log("Alguém solicitou contas gerais!");
    }

    if (topic == `${generalTopic}-parcial-bills`) {
        try {
            const response = await axios.get(`${backendBaseUrl}/bill/parcial-bills`);
            const apiData = await response.data;
            client.publish(generalTopic, JSON.stringify(apiData));
            console.log(`N° de acessos: ${nRequisicoes += 1}`);
        } catch (e) {
            console.log("Erro de conexão com o servidor backend");
        }
    }

    if (topic == `${generalTopic}-paids`) {
        try {
            const response = await axios.get(`${backendBaseUrl}/bill/paids`);
            const apiData = await response.data;
            client.publish(generalTopic, JSON.stringify(apiData));
        } catch (e) {
            console.error(e);
        }

    }

    if (topic == `${generalTopic}-somatotal&home`) {
        try {
            const response = await axios.get(data);
            const apiData = await response.data;
            if (data.includes("totals-by-period")) {
                client.publish(`${generalTopic}-summary-interface`, JSON.stringify(apiData));
                console.log("Alguém acessou o GeneralBills");
            }
            if (data.includes("bills-by-period")) {
                client.publish(generalTopic, JSON.stringify(apiData));
                console.log("Alguém está usando o filtro por período na home");
            }
        } catch (e) {
            console.error(e);
        }
    }

    if (topic == `${generalTopic}-get-month-income`) {
        const response = await axios.get(`${backendBaseUrl}/gains/get/month-income`);
        const data = response.data;
        client.publish(`${generalTopic}-income-data-response`, JSON.stringify(data));
    }

    // !-------------------------------------- POST !--------------------------------------  //
    if (topic == postTopic) {
        try {
            const jsonParse = JSON.parse(data);
            if (jsonParse.comprador == "Will") {
                jsonParse.comprador = "William";
            }
            if (jsonParse.comprador == "Lívia 🌻") {
                jsonParse.comprador = "Lívia";
            }
            const post = await axios.post(`${backendBaseUrl}/bill/save`, jsonParse);
            client.publish(generalTopic, JSON.stringify(post.data));
        } catch (e) {
            console.error(e);
            return;
        }
        client.publish(`${generalTopic}-ping-pong`, 'create');
        console.log("Foi cadastrado uma nova bill!");
        const jsonData = JSON.parse(data);
        /* if (isClientReady) {
            clientWpp.sendMessage(number, `💸 ${jsonData.comprador} registrou uma nova despesa no ${jsonData.banco}:\n📍 ${jsonData.titulo} – R$ ${jsonData.valor} (${jsonData.categoria})`);
            console.log("Mensagem do whats enviada.");
        } */
    }
    if (topic == `${generalTopic}-post-ganhos-trigger`) {
        try {
            const formattedData = JSON.parse(data);
            axios.post(`${backendBaseUrl}/gains/income`, formattedData);
        } catch (e) {
            console.error(e);
        }
    }


    // !-------------------------------------- PUT !--------------------------------------  //
    if (topic == putTopic) {
        try {
            await axios.put(`${backendBaseUrl}/bill/update`, JSON.parse(data));
            console.log('Alguém atualizou uma conta');
        } catch (e) {
            console.error(e);
            return;
        }
        client.publish(`${generalTopic}-ping-pong`, 'edit');
    }

    if (topic == `${generalTopic}-isPaid`) {
        await axios.put(`${backendBaseUrl}/bill/isPaid`, JSON.parse(data));
        console.log(`Alguém definiu alterou a conta de id ${JSON.parse(data).id} para: ${JSON.parse(data).isPaid}`);
    }


    // !-------------------------------------- DELETE !--------------------------------------  //
    if (topic == deleteTopic) {
        try {
            await axios.delete(`${backendBaseUrl}/bill/delete/${data}`);
            console.log("Alguém deletou uma bill!");
        } catch (e) {
            console.error(e);
            return;
        }
        client.publish(`${generalTopic}-ping-pong`, 'delete');
    }

});