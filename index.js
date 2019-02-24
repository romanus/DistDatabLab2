const MongoClient = require('mongodb').MongoClient
const DBRef = require('mongodb').DBRef
const uri = "mongodb+srv://user:8r3KcSM9AZuqEwybvBtjRTaa@cluster0-o7srs.mongodb.net/test?retryWrites=true"
const client = new MongoClient(uri, { useNewUrlParser: true })
var data = require('./data.json')

const names = {
	items: "items",
	orders: "orders"
}

client.connect(err => {
	if(err){
		console.log("Not connected to the cluster: " + err)
		return
	}
	console.log("Connected to the cluster!")

	const db = client.db("test")

	const connect = async (client) => {
		const db = client.db("test")
		
		await do_homework(db)

		client.close()
		console.log("Connection closed!")
	}
	
	connect(client)
})

async function do_homework(db){
	const items_local = data["items"]

	console.log("\n---- PART 1 START---- ")

	console.log("\n1. Створіть декілька товарів з різним набором властивостей Phone/TV/Smart Watch/ .... ")
	const items_inserted  = await db.collection(names.items).insertMany(items_local)
	console.log("Data inserted:" + JSON.stringify(items_inserted.ops))

	console.log("\n2.Напишіть запит, який виводіть усі товари (відображення у JSON)")
	const items_fetched = await db.collection(names.items).find({}).toArray()
	console.log("Data fetched:" + JSON.stringify(items_fetched))

	console.log("\n3. Підрахуйте скільки товарів у певної категорії")
	const phones_fetched = await db.collection(names.items).find({'category': 'Phone'}).toArray()
	console.log("Phones count: " + phones_fetched.length)

	console.log("\n4. Підрахуйте скільки є різних категорій товарів")
	const categories = (await db.collection(names.items).find({}).toArray())
		.map(obj => obj["category"])
		.filter((value, index, self) => self.indexOf(value) === index) // distinct
	console.log("Categories count: " + categories.length)

	console.log("\n5. Напишіть запити, які вибирають товари за різними критеріям і їх сукупності: ")

	console.log("\na) категорія та ціна (в проміжку)")
	const search_res_category_price = await db.collection(names.items)
		.find({'category':'Phone', 'price': {$lt: 750, $gt: 650}}).toArray()
	console.log(JSON.stringify(search_res_category_price))

	console.log("\nb) розмір (наприклад розмір взуття або діагональ екрану) або модель")
	const google_items = await db.collection(names.items)
		.find({'producer':'Google'}).toArray()
	console.log(JSON.stringify(google_items))

	console.log("\nc) конструкція з використанням in")
	const category_in_items = await db.collection(names.items)
		.find({'category': {$in: ['Phone', 'Smart Watch']}}).toArray()
	console.log(JSON.stringify(category_in_items))

	console.log("\n6. Виведіть список всіх виробників товарів без повторів")
	const producers = (await db.collection(names.items).find({}).toArray())
		.map(obj => obj["producer"])
		.filter((value, index, self) => self.indexOf(value) === index) // distinct
	console.log("Producers: " + JSON.stringify(producers))

	console.log("\n7. Оновить певні товари, змінивши існуючі значення і додайте нові властивості (характеристики) товару за певним критерієм")
	await db.collection(names.items).updateOne({'model':'iPhone 6'}, {$set: {'price':690}}, {'upsert': true})
	await db.collection(names.items).updateMany({'category':'Phone'}, {$set: {'screen_size': null}})
	const items_after_updates = await db.collection(names.items).find({}).toArray()
	console.log(JSON.stringify(items_after_updates))

	console.log("\n8. Знайдіть товари у яких є (присутнє поле) певні властивості")
	const have_screen_size = await db.collection(names.items).find({"screen_size": {$exists: true}}).toArray()
	console.log(JSON.stringify(have_screen_size))

	console.log("\n9. Для знайдених товарів збільшіть їх вартість на певну суму")
	console.log("Document before: " + JSON.stringify(await db.collection(names.items).findOne({model:'iPhone 6'})))
	await (await db.collection(names.items).find({model:'iPhone 6'}).toArray()).forEach(async item => {
			await db.collection(names.items).updateOne({_id: item._id},{$set: {price: item.price - 10}}
        )
	})
	console.log("Document after: " + JSON.stringify(await db.collection(names.items).findOne({model:'iPhone 6'})))

	console.log("\n---- PART 1 END ---- ")

	console.log("\n---- PART 2 START---- ")

	console.log("\n1. Створіть кілька замовлень з різними наборами товарів, але так щоб один з товарів був у декількох замовленнях")
	console.log("\n2. Виведіть всі замовлення")
	const items_remote_fixed = await db.collection(names.items).find({}).toArray()
	const orders_local = [
		{    
			"order_number" : 201513,
			"date" : new Date().toISOString()-100,
			"total_sum" : 1500,
			"customer" : {
				"name" : "Andrii",
				"surname" : "Rodinov",
				"phones" : [ 9876543, 1234567],
				"address" : "PTI, Peremohy 37, Kyiv, UA"
			},
			"payment" : {
				"card_owner" : "Andrii Rodionov",
				"cardId" : 12345678
			},
			"order_items_id" : [
				new DBRef(names.items, items_remote_fixed[0]),
				new DBRef(names.items, items_remote_fixed[1])
			]
		}
		,{    
			"order_number" : 201514,
			"date" : new Date().toISOString()-50,
			"total_sum" : 2000,
			"customer" : {
				"name" : "Andrii",
				"surname" : "Rodinov",
				"phones" : [ 9876543, 1234567],
				"address" : "PTI, Peremohy 37, Kyiv, UA"
			},
			"payment" : {
				"card_owner" : "Andrii Rodionov",
				"cardId" : 12345678
			},
			"order_items_id" : [
				new DBRef(names.items, items_remote_fixed[2])
			]
		}
		,{    
			"order_number" : 201515,
			"date" : new Date().toISOString(),
			"total_sum" : 2500,
			"customer" : {
				"name" : "Teodor",
				"surname" : "Romanus",
				"phones" : [ 1234567],
				"address" : "42 Vulytsya str., Lviv, UA"
			},
			"payment" : {
				"card_owner" : "Andrii Rodionov",
				"cardId" : 12345678
			},
			"order_items_id" : [
				new DBRef(names.items, items_remote_fixed[1]),
				new DBRef(names.items, items_remote_fixed[2])
			]
		}
	]

	await db.collection(names.orders).insertMany(orders_local)
	const all_orders = await db.collection(names.orders).find({}).toArray()
	console.log("Count: " + all_orders.length)
	console.log(JSON.stringify(all_orders))

	console.log("\n3. Виведіть замовлення з вартістю більше певного значення")
	const orders_expensive = await db.collection(names.orders).find({"total_sum": {$gt: 2000}}).toArray()
	console.log("Count: " + orders_expensive.length)
	console.log(JSON.stringify(orders_expensive))

	console.log("\n4. Знайдіть замовлення зроблені одним замовником")
	const single_customer = await db.collection(names.orders).find({"customer" : orders_local[0]["customer"]}).toArray()
	console.log("Count: " + single_customer.length)
	console.log(JSON.stringify(single_customer))

	console.log("\n5. Знайдіть всі замовлення з певним товаром (товарами) (шукати можна по ObjectId)")
	const objid_search = await db.collection(names.orders).find({"order_items_id": {$elemMatch : {"$id": items_remote_fixed[0]}}}).toArray()
	console.log("Count: " + objid_search.length)
	console.log(JSON.stringify(objid_search))

	console.log("\n---- PART 2 END---- ")

	await db.collection(names.items).deleteMany({})
	await db.collection(names.orders).deleteMany({})
}