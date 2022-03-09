const { stat } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass


//GET /orders - will list all orders
function list(req, res, next){
    res.json({ data: orders })
}

//GET /orders/:orderId - will list an order that corresponds with the orderId given
function read(req, res, next) {
    res.json({ data: res.locals.order })
}

//PUT /orders/:orderId - will update existing order
function update(req, res, next){
    const order = res.locals.order
    const originalResult = order.id
    const { data: { deliverTo, mobileNumber, dishes, quantity } = {} } = req.body;
    if (originalResult !== {deliverTo, mobileNumber, dishes, quantity}){
        order.deliverTo = deliverTo
        order.mobileNumber = mobileNumber
        order.dishes = dishes
        order.quantity = quantity
    }
    res.json({ data: order })
}

//POST /orders - will create a new order
function create(req, res, next){
    const { data: { deliverTo, mobileNumber, status, dishes} = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    orders.push(newOrder)
    res.status(201).json({ data: newOrder })
}

//DELETE /orders/:orderId - will delete an order based on the given id
function destroy(req, res, next){
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204)
}

//validation middleware:

//validate if order exists by checking id 
function orderIdExists(req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId)
    if (foundOrder){
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: "Order does not exist"
    })
}



//validate if 'deliver to' field exists and is formatted correctly
function deliverToExists(req, res, next){
    const { data: { deliverTo } = {} } = req.body;
    if(!deliverTo || deliverTo == ""){
        next({
            status: 400, 
            message: "Order must include a deliverTo"
        })
    }
    return next();
}

//validate if 'mobileNumber' field exists and is formatted correctly
function mobileNumberExists(req, res, next){
    const { data: { mobileNumber } = {} } = req.body;
    if(!mobileNumber || mobileNumber == ""){
        next({
            status: 400,
            message: "Order must include a mobileNumber"
        })
    }
    return next();
}

//validate if there are dishes within the order
function dishesExists(req, res, next){
    const { data: { dishes } = {} } = req.body;
    if(dishes){
        return next()
    }
    next({
        status: 400,
        message: "Order must include a dish"
    })
}

//validate if the dishes are an array that is not empty
function dishFormatCorrect(req, res, next){
    const { data: { dishes } = {} } = req.body;
    if (!Array.isArray(dishes) || dishes.length === 0){
        next({
            status: 400,
            message: `Order must include at least one dish`
        })
    }
    return next()
}

//validate if quantity property of 'dish' exists and is formatted correctly
function quantityExists(req, res, next){
    const { data: { dishes } = {} } = req.body;
    for (let dish of dishes){
        const quantityProperty = dish.quantity
        const index = dishes.indexOf(dish)
        if (quantityProperty === 0 || !Number.isInteger(quantityProperty)){
            next({
                status: 400, 
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            })     
        }
    }
       return next() 
}

//validate that a status property exists that is not an empty string
function statusPropertyExists(req, res, next){
    const { data: { status } = {} } = req.body;
    if(!status || status == ""){
        next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        })
    }
    return next();
}

function statusProperty(req, res, next){
    const { data: {status}  = {} } = req.body;
    if(status !== 'pending' && status != 'preparing' && status !== 'out-for-delivery' && status !== 'delivered'){
        next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
        })
    }
    return next()
}

//check if status property is set to 'delivered'
function statusPropertyDelivered(req, res, next){
    const { data: { status } = {} } = req.body;
    if(status === "delivered"){
        next({
            status: 400,
            message: "A delivered order cannot be changed"
        })
    }
    return next();
}

//check if status property is set to 'pending'
function statusPropertyPending(req, res, next){
    const { orderId } = req.params
    const foundOrder = orders.filter((order) => order.id == orderId)
    const orderStatus = foundOrder[0].status
    if (orderStatus !== 'pending'){
      next({
        status: 400,
        message: `An order cannot be deleted unless it is pending`
    })
    }
     return next()
}

//validate if orderId from route matches id listed on the order
function orderIdMatchesDataId(req, res, next){
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id && orderId !== id){
        next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
        })
    }
    return next()
}

function orderIdExistsForDelete(req, res, next){
   const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId)
    if (foundOrder){
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `${orderId}`
    })
}


module.exports = {
    list,
    read: [orderIdExists, read],
    put: [orderIdExists, orderIdMatchesDataId, dishFormatCorrect, deliverToExists, 
    mobileNumberExists, dishesExists, statusPropertyExists, statusPropertyDelivered, statusProperty, quantityExists, update],
    delete: [orderIdExistsForDelete, statusPropertyPending, destroy],
    create: [dishesExists, dishFormatCorrect, deliverToExists, mobileNumberExists, quantityExists, create]
}

