const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass


//GET /dishes - will return a list of all dishes
function list(req, res){
    res.json({ data: dishes })
}

//GET /dishes/:dishId - will list a dish that corresponds with the given dishId
function read(req, res, next){
    res.json({data: res.locals.dish})
}

//PUT /dishes/:dishId - will update an existing dish
function update(req, res, next){
    const dish = res.locals.dish;
    const originalResult = dish.id;
    const { data: { id, name, description, price, image_url } = {} } = req.body;
    if (originalResult !== { name, description, price, image_url}){
        dish.name = name
        dish.description = description
        dish.price = price
        dish.image_url = image_url
    }
    res.json({ data: dish })
}

//POST /dishes - will save a dish and respond with the newly created dish
function create(req, res){
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    }
    dishes.push(newDish);
    res.status(201).json({ data: newDish })
}

//validate if name exists 
function nameExists(req, res, next){
    const { data: { name } = {} } = req.body;
    if (!name || name == ""){
        next({
            status: 400,
            message: "Dish must include a name"
        })
    }
    return next();
}

//validate if description exists
function descriptionExists(req, res, next){
    const { data: { description } = {} } = req.body;
    if (!description || description == ""){
        next({
            status: 400,
            message: "Dish must include a description"
        })
    }
    return next();
}

//validate if price exists
function priceExists(req, res, next){
    const { data: { price } = {} } = req.body;
    if (!price || price <= 0){
        next ({
            status: 400, 
            message: "Dish must include a price"
        })
    }
    return next();
}

//validate if price is a number
function priceIsNumber(req, res, next){
    const { data: { price } = {} } = req.body;
    if (Number.isInteger(price)){
        return next()
    }
    next({
        status: 400,
        message: "Dish must include a price"
    })
}

//validate if image exists
function imageExists(req, res, next){
    const { data: { image_url } = {} } = req.body;
    if (!image_url || image_url == ""){
        next({
            status: 400,
            message: "Dish must include a image_url"
        })
    }
    return next();
}


//validate if dish already exists by checking dishId
function dishIdExists(req, res, next){
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId)
    if (foundDish){
        res.locals.dish = foundDish;
        next();
    }
    next({
        status: 404,
        message: "Dish does not exist: ${dishId}."
    })
}

//validate if dishId from route matches id listed on the dish
function dishIdMatchesDataId(req, res, next){
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;
    if (id && dishId !== id){
        next({
            status: 400,
            message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
        })
    }
    return next()
}



module.exports = {
    list,
    read: [dishIdExists, read],
    create: [nameExists, descriptionExists, priceExists, imageExists, create],
    put: [dishIdExists, dishIdMatchesDataId, nameExists, descriptionExists, priceExists, priceIsNumber, imageExists, update],
}