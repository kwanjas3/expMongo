const Sequelize = require('sequelize');
var sequelize = new Sequelize('redacted', 'redact', 'redacted', {
    host: 'ec2-redacted.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: true
    }
});

var Employee = sequelize.define('Employee', {
    employeeNum: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    last_name: Sequelize.STRING,
    email: Sequelize.STRING,
    SSN: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addresCity: Sequelize.STRING,
    addressState: Sequelize.STRING,
    addressPostal: Sequelize.STRING,
    maritalStatus: Sequelize.STRING,
    isManager: Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status: Sequelize.STRING,
    department: Sequelize.INTEGER,
    hireDate: Sequelize.STRING
});

var Department = sequelize.define('Department', {
    departmentId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});


exports.initialize = () => {
    return new Promise(function (resolve, reject) {
        sequelize.sync().then(function () {
            resolve();
        }).catch(function (err) {
            reject(err);
        });
    });
}

exports.getAllEmployees = () => {
    return new Promise((resolve, reject) => {
        Employee.findAll({
            order: ['employeeNum']
        }).then(function (data) {
            resolve(data);
        }).catch(function (err) {
            reject(err);
        });
    });

}

exports.getEmployeesByStatus = (stat) => {

    return new Promise(function (resolve, reject) {
        Employee.findAll({
            order: ['employeeNum'],
            where: {
                status: stat
            }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        });
    });

}

exports.getEmployeesByDepartment = (departments) => {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            order: ['employeeNum'],
            where: {
                department: departments
            }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        });
    });

}

exports.getEmployeesByManager = (emNum) => {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            order: ['employeeNum'],
            where: {
                employeeManagerNum: emNum
            }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        });
    });
}

exports.getEmployeesByNum = (num) => {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: {
                employeeNum: num
            }
        }).then((data) => {
            resolve(data[0]); // since it returns an array, we need index 0 for first match
        }).catch((err) => {
            reject(err);
        });
    });
}

exports.getManagers = () => {
    return new Promise(function (resolve, reject) {
        Employee.findAll({
            where: {
                isManager: true
            }
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        });
    });
}

exports.getDepartments = () => {
    return new Promise(function (resolve, reject) {
        Department.findAll({
            order: ["departmentId"]
        }).then((data) => {
            resolve(data);
        }).catch((err) => {
            reject(err);
        })
    });
}

exports.addEmployee = (employeeData) => {
    employeeData.isManager = (employeeData.isManager) ? true : false;
    for (let i in employeeData) {
        if (employeeData[i] == "") {
            employeeData[i] = null;
        }
    }
    return new Promise((resolve, reject) => {
        Employee.create({
            firstName: employeeData.firstName,
            last_name: employeeData.last_name,
            email: employeeData.email,
            SSN: employeeData.SSN,
            addressStreet: employeeData.addressStreet,
            addresCity: employeeData.addresCity,
            addressState: employeeData.addressState,
            addressPostal: employeeData.addressPostal,
            maritalStatus: employeeData.maritalStatus,
            isManager: employeeData.isManager,
            employeeManagerNum: employeeData.employeeManagerNum,
            status: employeeData.status,
            department: employeeData.department,
            hireDate: employeeData.hireDate
        }).then(() => {
            resolve();
        }).catch((err) => {
            reject(err);
        })
    });
}

exports.updateEmployee = (employeeData) => {
    employeeData.isManager = (employeeData.isManager) ? true : false;
    for (let i in employeeData) {
        if (employeeData[i] == "") {
            employeeData[i] = null;
        }
    }
    return new Promise((resolve, reject) => {

        Employee.update({
            firstName: employeeData.firstName,
            last_name: employeeData.last_name,
            email: employeeData.email,
            SSN: employeeData.SSN,
            addressStreet: employeeData.addressStreet,
            addresCity: employeeData.addresCity,
            addressState: employeeData.addressState,
            addressPostal: employeeData.addressPostal,
            maritalStatus: employeeData.maritalStatus,
            isManager: employeeData.isManager,
            employeeManagerNum: employeeData.employeeManagerNum,
            status: employeeData.status,
            department: employeeData.department,
            hireDate: employeeData.hireDate
        }, {
                where: {
                    employeeNum: employeeData.employeeNum
                }
            }).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
    });
}

exports.addDepartment = (departmentData) => {
    return new Promise((resolve, reject) => {
        for (let i in departmentData) {
            if (departmentData[i] == "") {
                departmentData[i] = null;
            }
        }
        Department.create({
            departmentName: departmentData.departmentName
        }).then(() => {
            resolve();
        }).catch((err) => {
            reject(err);
        })
    });
}

exports.updateDepartment = (departmentData) => {
    return new Promise((resolve, reject) => {
        for (let i in departmentData) {
            if (departmentData[i] == "") {
                departmentData[i] = null;
            }
        }
        Department.update({
            departmentName: departmentData.departmentName
        }, {
                where: {
                    departmentId: departmentData.departmentId
                }
            }).then(() => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
    });
}

exports.getDepartmentById = (id) => {
    return new Promise((resolve, reject) => {
        Department.findAll({
            where: {
                departmentId: id
            }
        }).then((data) => {
            resolve(data[0]);
        }).catch((err) => {
            reject(err);
        })
    });
}

exports.deleteEmployeeByNum = (empNum) => {
    return new Promise((resolve, reject) => {
        Employee.destroy({
            where: {
                employeeNum: empNum
            }
        }).then(() => {
            resolve();
        }).catch((err) => {
            console.log("failed to delete employee");
            reject(err);
        })
    });
}
