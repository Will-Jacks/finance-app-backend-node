const mqtt = require('mqtt');
const axios = require('axios');

//Api WPP
/* const { clientWpp, number, isClientReady } = require('./botWhats'); */
//const brokerUrl = "mqtt://test.mosquitto.org:1883";

const backendBaseUrl = "http://192.168.0.33:8080/bill";
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

client.subscribe(postTopic);
client.subscribe(putTopic);
client.subscribe(deleteTopic);



client.on("message", async (topic, payload) => {
    const data = payload.toString();

    // !-------------------------------------- GET !--------------------------------------  //
    if (topic == `${generalTopic}-all`) {
        try {
            const response = await axios.get(`${backendBaseUrl}/all`);
            const apiData = await response.data;
            client.publish(generalTopic, JSON.stringify(apiData));
        } catch (e) {
            console.error(e);
        }

        console.log("Alguém solicitou contas gerais!");
    }

    if (topic == `${generalTopic}-parcial-bills`) {
        try {
            const response = await axios.get(`${backendBaseUrl}/parcial-bills`);
            const apiData = await response.data;
            client.publish(generalTopic, JSON.stringify(apiData));
            console.log(`N° de acessos: ${nRequisicoes += 1}`);
        } catch (e) {
            console.log("Erro de conexão com o servidor backend");
        }
    }

    if (topic == `${generalTopic}-paids`) {
        try {
            const response = await axios.get(`${backendBaseUrl}/paids`);
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

    // !-------------------------------------- POST !--------------------------------------  //
    if (topic == postTopic) {
        try {
            axios.post(`${backendBaseUrl}/save`, JSON.parse(data));
        } catch (e) {
            console.error(e);
        }
        console.log("Foi cadastrado uma nova bill!");
        const jsonData = JSON.parse(data);
        /* if (isClientReady) {
            clientWpp.sendMessage(number, `Foi criado uma nova conta: \n${jsonData.titulo}\nR$ ${jsonData.valor}\n${jsonData.comprador}\n${jsonData.categoria}`);
        } */
    }


    // !-------------------------------------- PUT !--------------------------------------  //
    if (topic == putTopic) {
        try {
            axios.put(`${backendBaseUrl}/update`, JSON.parse(data));
            console.log('Alguém atualizou uma conta');
        } catch (e) {
            console.error(e);
        }
    }

    if (topic == `${generalTopic}-isPaid`) {
        await axios.put(`${backendBaseUrl}/isPaid`, JSON.parse(data));
        console.log(`Alguém definiu alterou a conta de id ${JSON.parse(data).id} para: ${JSON.parse(data).isPaid}`);
    }


    // !-------------------------------------- DELETE !--------------------------------------  //
    if (topic == deleteTopic) {
        try {
            await axios.delete(`${backendBaseUrl}/delete/${data}`);
            console.log("Alguém deletou uma bill!");
        } catch (e) {
            console.error(e);
        }
    }

});

/*
    client.subscribe(`${generalTopic}-filtro-comprador`);
    client.subscribe(`${generalTopic}-filtro-banco`);
    client.subscribe(`${generalTopic}-filtro-comprador-banco`);
    client.subscribe(`${generalTopic}-filtro-allbanks`);

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

    if (topic == `${generalTopic}-filtro-comprador-banco`) {
        const formattedData = JSON.parse(data);
        try {
            const response = await axios.get(`${backendBaseUrl}/filter`, {
                params: {
                    comprador: formattedData.comprador,
                    banco: formattedData.banco
                }
            });
            const apiData = await response.data;
            client.publish(generalTopic, JSON.stringify(apiData));
            console.log(`Alguém tá usando o filtro comprador-banco: ${data}`);
        } catch (e) {
            console.error(e);
        }
    }
*/