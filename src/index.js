const express = require("express");
const { v4: uuid } = require("uuid");

const app = express();

app.use(express.json())

const customers = [];

function verifyIfExistsAccountCPF(req, res, next) {
    const { cpf } = req.headers;
    const customer = customers.find(customers => customers.cpf === cpf);

    if (!customer) {
        return res.status(400).json({ error: "Customer not found!" });
    }

    req.customer = customer;

    return next();
};

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
};

app.post("/account", (req, res) => {
    const { cpf, name } = req.body;
    const customersAlreadyExists = customers.some(
        (customers) => customers.cpf === cpf
    );

    if (customersAlreadyExists) {
        return res.status(400).json({ error: "Customers already exixts!" });
    };

    customers.push({
        cpf, name,
        id: uuid(),
        statement: []
    });

    return res.status(201).json({ message: "Account created with success" });
});

app.get("/statement", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.status(200).json(customer.statement);

});

app.post("/deposit", verifyIfExistsAccountCPF, (req, res) => {
    const { description, amount } = req.body;
    const { customer } = req;

    const statementOperation = {
        description, amount,
        created_date: new Date(),
        type: "credit"
    };

    customer.statement.push(statementOperation);

    return res.status(201).json({ message: "Deposit made with success!" })
});


app.post("/withdraw", verifyIfExistsAccountCPF, (req, res) => {
    const { amount } = req.body;
    const { customer } = req;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return res.status(400).json({ error: "Insufficient funds!" })
    }

    const statementOperation = {
        amount,
        created_date: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return res.status(201).json({ message: "Withdraw made with success!" });
});

app.get("/statement/date", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;
    const { date } = req.query;

    const dateformat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.created_date.toDateString() ===
        new Date(dateformat).toDateString());


    return res.status(200).json(statement);

});

app.put("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { name } = req.body;
    const { customer } = req;

    customer.name = name;

    return res.status(201).json({ message: "Account updated with success" });
});

app.get("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    return res.json(customer)
});

app.delete("/account", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    customers.splice(customer, 1);

    return res.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (req, res) => {
    const { customer } = req;

    const balance = getBalance(customer.statement);

    return res.status(200).json({message: `Your balance is ${balance}`});

});


app.listen(3333, () => {
    console.log("Server is Running")
});