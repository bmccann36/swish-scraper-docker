import puppeteer from 'puppeteer'
import cheerio from 'cheerio'
import { DynamoDBClient, GetItemCommand, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb'

const dynamoClient = new DynamoDBClient({})

import twilio from 'twilio'
const twilioClient = twilio(process.env.TWILIO_ACCT_ID, process.env.TWILIO_AUTH_TOKEN)

let FOUND_NEW_CLASSES = false


//? USE PUPPETEER TO SCRAPE PAGE
const dates = await getDateArray();


const sorted = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
const latest = sorted[0]
console.log('>>latest', latest)

const existsInTable = await findDynamoEntry(latest)

//? SEND SMS
if (!existsInTable) {
    console.log('!! new classes are available !!')
    FOUND_NEW_CLASSES = true

    const smsRes = await twilioClient.messages.create(
        { body: `new class available on ${latest}`, from: "+18444741202", to: "+16072675548" }
    )
    console.log('twilio send status: ', smsRes.status)

}// no new classes case
else {
    console.log('no new classes available :( ')
}

//? WRITE NEW STUFF TO DYNAMO
if (FOUND_NEW_CLASSES) {
    console.log('updating dynamo table with latest dates')
    await writeDatesDynamo(sorted)
}

process.exit(0)


async function getDateArray() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
        headless: true,
    })

    const page = await browser.newPage()

    await page.goto('https://www.swishhouse.com/book-brooklyn')

    // Set screen size
    await page.setViewport({
        width: 1080,
        height: 1024
    })

    // close the pop up
    const searchResultSelector = '.sqs-popup-overlay-close'
    await page.waitForSelector(searchResultSelector)
    await page.click(searchResultSelector)

    // wait for element to load "bw-widget__day"
    const daySelector = '.bw-widget__day'
    const node = await page.waitForSelector(daySelector)

    // get the timeslots
    const sessionsHtmlArray = await page.$$eval('.hc_time', elements => elements.map(e => e.innerHTML))

    // with CHEERIO
    const dayArrayUtc = sessionsHtmlArray.map(el => {
        // console.log('new element ----\n')
        // console.log("HTML: \n", el)
        const element = cheerio.load(el)
        const datetimeValue = element('time.hc_starttime').attr('datetime')
        return datetimeValue
        // console.log('----\n')
    })

    await page.close()

    return dayArrayUtc
}

async function findDynamoEntry(dateIsoString) {

    const command = new GetItemCommand({
        TableName: 'swish-house-class-dates',
        Key: {
            class_date: { S: dateIsoString },
        },
    })
    const response = await dynamoClient.send(command)
    return response.Item
}

async function writeDatesDynamo(dateStringArr) {
    const putReqs = dateStringArr.map(dateStr => {
        return {
            PutRequest: {
                Item: {
                    class_date: { S: dateStr }
                }
            }
        }
    })
    // Set the parameters
    const params = {
        RequestItems: {
            'swish-house-class-dates': putReqs
        },
        // ReturnConsumedCapacity: 'TOTAL',
    }
    const response = await dynamoClient.send(new BatchWriteItemCommand(params))
    console.log(response.$metadata)
}
