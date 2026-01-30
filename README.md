# Finance App - MQTT Middleware

![Node.js](https://img.shields.io/badge/node.js-6DA35F?style=for-the-badge&logo=node.js&logoColor=white)
![MQTT](https://img.shields.io/badge/MQTT-3C22B4?style=for-the-badge&logo=mqtt&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)

Este projeto atua como a **ponte de comunicação (Middleware)** entre o Frontend em React e o Backend em Java. Ele utiliza o protocolo MQTT para permitir que o sistema funcione sem a necessidade de expor o banco de dados ou o backend diretamente na internet.

## O Papel do Middleware

Em cenários onde o backend está rodando em um ambiente local (localhost) sem IP público, este middleware resolve o desafio de conectividade:
1.  **Escuta:** O Node.js fica subscrito a diversos tópicos em um Broker MQTT na nuvem.
2.  **Processa:** Ao receber um comando do Frontend (via MQTT), ele valida os dados e faz uma requisição HTTP local (Axios) para o servidor Java.
3.  **Responde:** O resultado retornado pelo Java é então publicado de volta no MQTT para que o Frontend atualize a interface em tempo real.

## Funcionalidades Principais

* **Roteamento de Mensagens:** Tradução de eventos MQTT (tópicos de post, put, delete) para requisições REST.
* **Sincronização em Tempo Real:** Garante que as atualizações financeiras sejam refletidas instantaneamente em todos os dispositivos conectados.
* **Tratamento de Dados:** Normalização de campos (como nomes de compradores) antes do envio para o banco de dados.
* **Logging de Acessos:** Monitoramento em tempo real das requisições e interações no terminal.

## 🛠️ Stack Tecnológica

* **Runtime:** Node.js
* **Comunicação:** MQTT.js (via WebSockets/TCP)
* **HTTP Client:** Axios (para comunicação com o Backend Java)
* **Broker Utilizado:** EMQX (WSS Protocol)

## Tópicos de Comunicação

O middleware gerencia o fluxo de dados através dos seguintes canais:

| Tópico Principal | Função |
| :--- | :--- |
| `finance-bills-app-...-all` | Solicitação de carga total de dados. |
| `finance-bills-app-...-post` | Recebimento de novas despesas para cadastro. |
| `finance-bills-app-...-put` | Atualização de despesas existentes. |
| `finance-bills-app-...-delete` | Remoção de registros por ID. |
| `finance-bills-app-...-isPaid` | Alteração rápida do status de pagamento. |

---
🔹 *Este projeto demonstra uma solução criativa para o uso de protocolos de IoT (Internet of Things) em aplicações web convencionais.*
