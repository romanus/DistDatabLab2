const MongoClient = require('mongodb').MongoClient
const DBRef = require('mongodb').DBRef
const uri = "mongodb+srv://user:8r3KcSM9AZuqEwybvBtjRTaa@cluster0-o7srs.mongodb.net/test?retryWrites=true"
const client = new MongoClient(uri, { useNewUrlParser: true })
var data = require('./data.json')

const string = {
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

	// cleaning up
	await db.collection(string.items).deleteMany({})
	await db.collection(string.orders).deleteMany({})

	const items_local = data["items"]

	console.log("\n---- PART 1 START---- ")

	console.log("\n1. Створіть декілька товарів з різним набором властивостей Phone/TV/Smart Watch/ .... ")
	const items_inserted  = await db.collection(string.items).insertMany(items_local)
	console.log("Data inserted:" + JSON.stringify(items_inserted.ops))

	console.log("\n2.Напишіть запит, який виводіть усі товари (відображення у JSON)")
	const items_fetched = await db.collection(string.items).find({}).toArray()
	console.log("Data fetched:" + JSON.stringify(items_fetched))

	console.log("\n3. Підрахуйте скільки товарів у певної категорії")
	const phones_fetched = await db.collection(string.items).find({'category': 'Phone'}).toArray()
	console.log("Phones count: " + phones_fetched.length)

	console.log("\n4. Підрахуйте скільки є різних категорій товарів")
	const categories = (await db.collection(string.items).find({}).toArray())
		.map(obj => obj["category"])
		.filter((value, index, self) => self.indexOf(value) === index) // distinct
	console.log("Categories count: " + categories.length)

	console.log("\n5. Напишіть запити, які вибирають товари за різними критеріям і їх сукупності: ")

	console.log("\na) категорія та ціна (в проміжку)")
	// Prices in inside [650,750]
	const search_res_category_price = await db.collection(string.items)
		.find({'category':'Phone', 'price': {$lt: 750, $gt: 650}}).toArray()
	console.log(JSON.stringify(search_res_category_price))

	console.log("\nb) розмір (наприклад розмір взуття або діагональ екрану) або модель")
	// items made by Google
	const google_items = await db.collection(string.items)
		.find({'producer':'Google'}).toArray()
	console.log(JSON.stringify(google_items))

	console.log("\nc) конструкція з використанням in")
	// Only phones and watches
	const category_in_items = await db.collection(string.items)
		.find({'category': {$in: ['Phone', 'Smart Watch']}}).toArray()
	console.log(JSON.stringify(category_in_items))

	console.log("\n6. Виведіть список всіх виробників товарів без повторів")
	const producers = (await db.collection(string.items).find({}).toArray())
		.map(obj => obj["producer"])
		.filter((value, index, self) => self.indexOf(value) === index) // distinct
	console.log("Producers: " + JSON.stringify(producers))

	console.log("\n7. Оновить певні товари, змінивши існуючі значення і додайте нові властивості (характеристики) товару за певним критерієм")
	// Update price of iPhone 6, add screen_size to phones
	await db.collection(string.items).updateOne({'model':'iPhone 6'}, {$set: {'price':690}}, {'upsert': true})
	await db.collection(string.items).updateMany({'category':'Phone'}, {$set: {'screen_size': null}})
	const items_after_updates = await db.collection(string.items).find({}).toArray()
	console.log(JSON.stringify(items_after_updates))

	console.log("\n8. Знайдіть товари у яких є (присутнє поле) певні властивості")
	// Get all items that have the field "screen_size"
	const have_screen_size = await db.collection(string.items).find({"screen_size": {$exists: true}}).toArray()
	console.log(JSON.stringify(have_screen_size))

	console.log("\n9. Для знайдених товарів збільшіть їх вартість на певну суму")
	// Increase prices of all iPhones 6
	console.log("Document before: " + JSON.stringify(await db.collection(string.items).findOne({model:'iPhone 6'})))
	await (await db.collection(string.items).find({model:'iPhone 6'}).toArray()).forEach(async item => {
			await db.collection(string.items).updateOne({_id: item._id},{$set: {price: item.price - 10}}
        )
	})
	console.log("Document after: " + JSON.stringify(await db.collection(string.items).findOne({model:'iPhone 6'})))

	console.log("\n---- PART 1 END ---- ")

	console.log("\n---- PART 2 START---- ")

	// initial setup
	const items_remote_fixed = await db.collection(string.items).find({}).toArray()
	const time = new Date()
	const orders_local = data["orders"]

	orders_local[0]["date"] = time - 100
	orders_local[0]["order_items_id"] = [ new DBRef(string.items, items_remote_fixed[0]), new DBRef(string.items, items_remote_fixed[1])]
	orders_local[1]["date"] = time - 50
	orders_local[1]["order_items_id"] = [ new DBRef(string.items, items_remote_fixed[2])]
	orders_local[2]["date"] = time - 25
	orders_local[2]["order_items_id"] = [ new DBRef(string.items, items_remote_fixed[1]), new DBRef(string.items, items_remote_fixed[2])]

	console.log("\n1. Створіть кілька замовлень з різними наборами товарів, але так щоб один з товарів був у декількох замовленнях")
	await db.collection(string.orders).insertMany(orders_local)

	console.log("\n2. Виведіть всі замовлення")
	const all_orders = await db.collection(string.orders).find({}).toArray()
	console.log("Count: " + all_orders.length)
	console.log(JSON.stringify(all_orders))

	console.log("\n3. Виведіть замовлення з вартістю більше певного значення")
	// All orders with total_sum > 2000
	const orders_expensive = await db.collection(string.orders).find({"total_sum": {$gt: 2000}}).toArray()
	console.log("Count: " + orders_expensive.length)
	console.log(JSON.stringify(orders_expensive))

	console.log("\n4. Знайдіть замовлення зроблені одним замовником")
	// All orders of the customer that has the first order
	const single_customer = await db.collection(string.orders).find({"customer" : orders_local[0]["customer"]}).toArray()
	console.log("Count: " + single_customer.length)
	console.log(JSON.stringify(single_customer))

	console.log("\n5. Знайдіть всі замовлення з певним товаром (товарами) (шукати можна по ObjectId)")
	// Search for all orders that contain item items_remote_fixed[0]
	const objid_search = await db.collection(string.orders).find({"order_items_id": {$elemMatch : {"$id": items_remote_fixed[0]}}}).toArray()
	console.log("Count: " + objid_search.length)
	console.log(JSON.stringify(objid_search))

	console.log("\n6. Додайте в усі замовлення з певним товаром ще один товар і збільште існуючу вартість замовлення на деяке значення Х")
	// Search for all orders that contain item items_remote_fixed[1], add items_remote_fixed[3]
	await (await db.collection(string.orders).find({"order_items_id": {$elemMatch : {"$id": items_remote_fixed[1]}}}).toArray()).forEach(async (order) => {
		await db.collection(string.orders).updateOne({'order_number': order["order_number"]}, 
			{$push:{"order_items_id": items_remote_fixed[3]}, $set: {"total_sum": order["total_sum"] + items_remote_fixed[3].price}}
		)
	})
	const after_update = await db.collection(string.orders).find({"order_items_id": {$elemMatch : {"$id": items_remote_fixed[1]}}}).toArray()
	console.log(JSON.stringify(after_update))

	console.log("\n7. Виведіть кількість товарів в певному замовленні")
	const products_count = (await db.collection(string.orders).findOne({}))['order_items_id'].length
	console.log("Products count in the first order: " + products_count)

	console.log("\n8. Виведіть тільки інформацію про кастомера і номери кредитної карт, для замовлень вартість яких перевищує певну суму")
	// All order that have total_sum > 1900
	const total_sum_gt = (await db.collection(string.orders).find({"total_sum": {$gt: 1900}}).toArray()).map(order => new Object({customer: order.customer, payment: order.payment}))
	console.log(JSON.stringify(total_sum_gt))

	console.log("\n9. Видаліть товар з замовлень, зроблених за певний період дат")
	console.log("Records before: " + (await db.collection(string.orders).countDocuments()))
	const deleted = await db.collection(string.orders).deleteMany({"date": {$gt: time - 200, $lt: time - 40}})
	console.log("Deleted items count: " + deleted)
	console.log("Records after: " + (await db.collection(string.orders).countDocuments()))

	console.log("\n10. Перейменуйте у всіх замовлення ім'я (прізвище) замовника")
	console.log("Orders before: " + JSON.stringify(await db.collection(string.orders).find({}).toArray()))
	await db.collection(string.orders).updateMany({}, {$set: {"customer.name": "New Name"}})
	console.log("Orders after: " + JSON.stringify(await db.collection(string.orders).find({}).toArray()))

	// console.log("\n11*. Знайдіть замовлення зроблені одним замовником, і виведіть тільки інформацію про кастомера та товари у замовлені підставивши замість ObjectId(\"***\") назви товарів та їх вартість (аналог join-а між таблицями orders та items).")
	// const response = await db.collection(string.orders).mapReduce(
	// 	() => emit(this["customer"], this["order_items_id"]),
	// 	(key, values) => values.flat(),
	// 	{out: {inline: 1}}
	// )
	// console.log(response)

	console.log("\n---- PART 2 END---- ")

	await db.collection(string.items).deleteMany({})
	await db.collection(string.orders).deleteMany({})
}