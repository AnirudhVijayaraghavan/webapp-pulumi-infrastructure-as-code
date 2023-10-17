const express = require('express');
const router = express.Router();
//const { Account } = require('./models')
//const { Assignment } = require('./models')
var bcrypt = require('bcrypt');


router.use(express.json());
var bodyParser = require('body-parser');

//FOR ACCOUNT
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({
    dialect: "postgres",
    host: "localhost",
    database: "test",
    username: "postgres",
    password: "900900"
});
const Account = sequelize.define('account', {
    first_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    last_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    createdAt: {
        field: 'account_created',
        allowNull: false,
        type: DataTypes.DATE
    },
    updatedAt: {
        field: 'account_updated',
        allowNull: false,
        type: DataTypes.DATE
    }
}, {
    tableName: 'account', // Specify the correct table name here
});
//FOR ASSIGMENT
//const { Sequelize, DataTypes } = require('sequelize');
const sequelize2 = new Sequelize({
    dialect: "postgres",
    host: "localhost",
    database: "test",
    username: "postgres",
    password: "900900"
});
const Assignment = sequelize2.define('assignment', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
    },
    points: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 100,
        },
    },
    num_of_attemps: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 100,
        },
    },
    deadline: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: true
        },
    },
    createdAt: {
        field: 'assignment_created',
        allowNull: false,
        type: DataTypes.DATE
    },
    updatedAt: {
        field: 'assignment_updated',
        allowNull: false,
        type: DataTypes.DATE
    }
}, {
    tableName: 'assignment', // Specify the correct table name here
});


async function initializeDatabase() {

    try {
        // Check if the "ASSIGNMENT" table exists
        const AssignmentTableExists = await sequelize2.getQueryInterface().showAllTables();

        if (!AssignmentTableExists.includes('assignment')) {
            // The "ASSIGNMENT" table doesn't exist, so create it
            await sequelize2.getQueryInterface().createTable('assignment', {
                id: {
                    type: Sequelize.UUID,
                    allowNull: false,
                    defaultValue: sequelize2.fn('uuid_generate_v4')
                },
                name: {
                    type: Sequelize.STRING,
                    allowNull: false,
                },
                points: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    validate: {
                        min: 1,
                        max: 100,
                    },
                },
                num_of_attemps: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                    validate: {
                        min: 1,
                        max: 100,
                    },
                },
                deadline: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                assignment_created: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
                assignment_updated: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                },
            });
        }

        //enter logic
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}
initializeDatabase();
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// GET ALL ASSIGNMENTS ON AUTHENTICATION.
router.get('/v1/assignments', async (req, res) => {
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);

    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            if (account) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with retrieving assignments
                        Assignment.findAll()
                            .then((assignments) => {
                                res.status(200).json(assignments);
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    } else {
                        // Passwords do not match
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            console.error(error);
        });
});

var regExString = /^[a-zA-Z0-9]+$/;
// INSERT ASSIGNMENT ON SUCCESSFUL AUTHENTICATION.
router.post('/v1/assignments', async (req, res) => {
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);

    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            if (account) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        console.error(err);
                    } else if (result) {
                        if (Object.keys(req.body).length > 0) {
                            console.log(req.body.points)
                            if ((req.body.points > 100 || req.body.points < 0 ) || (req.body.num_of_attemps > 100 || req.body.num_of_attemps < 0)) {
                                res.status(400).json({ error: 'Incomplete or bad parameters, check table specifications.' });

                            }
                            else {
                                // Passwords match, proceed with creating assignment.

                                const newAssignment = {
                                    id: account.id,
                                    name: req.body.name,
                                    points: req.body.points,
                                    num_of_attemps: req.body.num_of_attemps,
                                    deadline: req.body.deadline,
                                };

                                Assignment.create(newAssignment)
                                    .then((createdAssignment) => {
                                        res.status(201).json(createdAssignment);
                                    })
                                    .catch((error) => {
                                        console.error(error);
                                    });
                            }

                        }
                        else {
                            res.status(400).json({ error: 'Incomplete or bad parameters, check table specifications.' });
                        }
                    } else {
                        // Passwords do not match
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            console.error(error);
        });
});

// GET ALL ASSIGNMENTS/{id} ON AUTHENTICATION.
router.use('/v1/assignments/:id', function (req, res, next) {
    console.log('User I.D.:', req.params.id);
    next();
});
router.get('/v1/assignments/:id', async (req, res) => {
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);
    console.log(req.params.id);
    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            console.log(account);
            if (account.id === req.params.id) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with retrieving assignments
                        Assignment.findOne({
                            where: {
                                id: req.params.id,
                            },
                        })
                            .then((assignment) => {
                                if (assignment) {
                                    // Assignment with the specified ID found, respond with it
                                    res.status(200).json(assignment);
                                } else {
                                    // Assignment with the specified ID not found
                                    res.status(404).json({ error: 'Assignment not found' });
                                }
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    } else {
                        // Passwords do not match
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            console.error(error);
        });
});

// DELETE ALL ASSIGNMENTS/{id} ON AUTHENTICATION.
router.delete('/v1/assignments/:id', async (req, res) => {
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);
    console.log(req.params.id);
    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            console.log(account);
            if (account.id === req.params.id) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with deleting assignments
                        Assignment.destroy({
                            where: {
                                id: req.params.id,
                            },
                        })
                            .then((rowsDeleted) => {
                                if (rowsDeleted > 0) {
                                    // Records deleted successfully
                                    res.status(204).end(); // No content response
                                } else {
                                    // Assignment with the specified ID not found
                                    res.status(404).json({ error: 'Assignment not found' });
                                }
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    } else {
                        // Passwords do not match
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            console.error(error);
        });
});

// UPDATE ALL ASSIGNMENTS/{id} ON AUTHENTICATION.
router.put('/v1/assignments/:id', async (req, res) => {
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic') === -1) {
        return res.status(403).json({
            message: 'Forbidden'
        })
    }
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log(email, password);
    console.log(req.params.id);
    Account.findOne({
        where: {
            email: email,
        },
    })
        .then((account) => {
            console.log(account);
            if (account.id === req.params.id) {
                // Account found, now compare the provided password with the stored hashed password
                bcrypt.compare(password, account.password, (err, result) => {
                    if (err) {
                        console.error(err);
                    } else if (result) {
                        // Passwords match, proceed with updating assignments
                        Assignment.update(
                            {
                                name: req.body.name,
                                points: req.body.points,
                                num_of_attemps: req.body.num_of_attemps,
                                deadline: req.body.deadline,
                            },
                            {
                                where: {
                                    id: req.params.id,
                                },
                            }
                        )
                            .then((rowsUpdated) => {
                                if (rowsUpdated > 0) {
                                    // Records updated successfully
                                    res.status(204).json({ error: 'Record updated.' }); // No content response
                                } else {
                                    // No changes made.
                                    res.status(404).json({ error: 'No Changes made.' });
                                }
                            })
                            .catch((error) => {
                                console.error(error);
                            });
                    } else {
                        // Passwords do not match
                        res.status(401).json({ error: 'Unauthorized' });
                    }
                });
            } else {
                // No account found with the provided email
                res.status(401).json({ error: 'Unauthorized' });
            }
        })
        .catch((error) => {
            console.error(error);
        });
});
router.patch('/v1/assignments', (req, res) => {
    res.status(405).send();
    console.log("405");
  });

module.exports = router






