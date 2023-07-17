// Написать NodeJS сервис, который будет 
// возвращать JSON массив объектов, содержащих информацию об остатках на складе "Казань WB", 
// информацию тянуть с сайта wildberries.ru, поля: Артикул, [Размер 1, Размер 2... Размер N]
//  ( Например { Art: 138593051, "85E": 4, "100E": 14 ... }). Артикулы:  138593051, 94340317,
//   94340606, 138590435, 138607462, 94339119, 94339244.

const axios = require('axios');

//  input data
const articleNumbers = [138593051, 94340317, 94340606, 138590435, 138607462, 94339119, 94339244];
const storageName = 'Казань WB';



async function fetchStorageId(storageName) {
  /**
   * Получает id склада по названию
   * @property {String} storageName - название склада
   * @returns {Number} storageId - id склада
   */
  const url = `https://www.wildberries.ru/webapi/spa/product/deliveryinfo`
  try {
    const response = await axios.get(url);
    const storages = response.data.value.times;
    let storageId = null;
    for (let storage of storages) {
      if (storage.storeName === storageName) {
        storageId = storage.storeId;
        break;
      }
    }

    //вывод id склада
    console.log(`id склада ${storageName}: ${storageId}`);


    return storageId;
  } catch (error) {
    console.error(`Неудалось получить id склада ${storageName}: ${error.message}`);
    return null;
  }
}


function findQuantity(stocks, storageId){
  /**
   * Ищет количество товара на складе по id склада
   * @property {Array} stocks - массив объектов с информацией о наличии товара на складе
   * @property {Number} storageId - id склада
   * @returns {Number} quantity - количество товара на складе
  */
  let quantity = stocks.filter(stock => stock.wh == storageId)[0]?.qty;
  return quantity;
}


async function fetchStockInfo(articleNumber, storageId) {
  /**
   * Получает информацию о наличии товара на складе
   * @property {Number} articleNumber - артикул товара
   * @property {Number} storageId - id склада
   * @returns {Object} stockInfo - объект с информацией о наличии товара на складе
  */
  const url = `https://card.wb.ru/cards/detail?appType=1&curr=rub&dest=-1257786&spp=0&nm=${articleNumber}`
  
  try {
    const response = await axios.get(url);
    const sizesTable = response.data.data.products[0].sizes;
    const sizes = sizesTable.map(size => {
      let quantity = findQuantity(size.stocks, storageId);
      quantity = quantity ? quantity: 0;
      return{
        [size.origName]: quantity
      } 
    })
    return{
      Art: articleNumber,
      sizes
    }
    
  } catch (error) {
    console.error(`Неудалось получить данные по товару ${articleNumber}: ${error.message}`);
    return null;
  }
}

async function fetchStockInfoForAllArticles() {
  /**
   * Получает информацию о наличии товара на складе для всех articleNumbers
   * @returns {Array} stockInfo - массив объектов с информацией о наличии товаров на складе
  */
  const storageId = await fetchStorageId(storageName);
  const stockInfoPromises = articleNumbers.map(articleNumber => fetchStockInfo(articleNumber,storageId));
  const stockInfo = await Promise.all(stockInfoPromises);

  return stockInfo.filter(info => info !== null);
}

// output data
fetchStockInfoForAllArticles()
  .then(stockInfo => {
    console.log(JSON.stringify(stockInfo));
  })
  .catch(error => {
    console.error('Ошибка:', error);
  });
