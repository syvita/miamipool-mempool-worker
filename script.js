/**
 * Example someHost is set up to take in a JSON request
 * Replace url with the host you wish to send requests to
 * @param {string} someHost the host to send the request to
 * @param {string} url the URL to send the request to
 */
const someHost = "https://stacks-node-api.stacks.co"
const url = someHost + "/extended/v1/tx/mempool?address=SP343J7DNE122AVCSC4HEK4MF871PW470ZSXJ5K66.miamipool-v1&limit=200&offset=0&unanchored=true"
/**
 * gatherResponse awaits and returns a response body as a string.
 * Use await gatherResponse(..) in an async function to get the response body
 * @param {Response} response
 */
async function gatherResponse(response) {
  const { headers } = response
  const contentType = headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    var temp = await response.json()
    if (temp.total >= temp.limit) {return {'error': 'mempool has over 200 transactions'}}
    var transactions = temp.results.map(function(i){
      return {
        sender_address: i.sender_address,
        tx_type: i.tx_type,
        function_name: i.contract_call.function_name,
        receipt_time_iso: i.receipt_time_iso,
        function_repr: (i.contract_call.function_args[0] && i.contract_call.function_args[0].repr)?i.contract_call.function_args[0].repr.slice(1):null,
        fee_rate: i.fee_rate/1000000+' STX'
      }
    })
    var filtered_transactions = transactions.filter(function(i){
      return (i.function_name === 'mine' || i.function_name === 'claim-mining-reward' || i.function_name === 'payout-mia')
    })
    var claim_mining_rewards = transactions.filter(function(i){
      return i.function_name === 'claim-mining-reward'
    }).map(function(m) {
      return {
        sender_address: m.sender_address,
        receipt_time_iso: m.receipt_time_iso,
        roundId: m.function_repr,
        fee_rate: m.fee_rate
      }
    })
    var mine = transactions.filter(function(i){
      return i.function_name === 'mine'
    }).map(function(m) {
      return {
        sender_address: m.sender_address,
        receipt_time_iso: m.receipt_time_iso,
        roundId: m.function_repr,
        fee_rate: m.fee_rate
      }
    })
    var payout_mia = transactions.filter(function(i){
      return i.function_name === 'payout-mia'
    }).map(function(m) {
      return {
        sender_address: m.sender_address,
        receipt_time_iso: m.receipt_time_iso,
        roundId: m.function_repr,
        fee_rate: m.fee_rate
      }
    })
    return JSON.stringify({
      'mine': mine,
      'claim-mining-rewards': claim_mining_rewards,
      'payout-mia': payout_mia
    })
    
  }
  else if (contentType.includes("application/text")) {
    return response.text()
  }
  else if (contentType.includes("text/html")) {
    return response.text()
  }
  else {
    return response.text()
  }
}

async function handleRequest() {
  const init = {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  }

  const response = await fetch(url, init)
  const results = await gatherResponse(response)

  myObj = JSON.parse(results);
  claims = myObj['claim-mining-rewards'];
  mine = myObj['mine'];
  payout = myObj['payout-mia'];
  let text = "<table border='1'><tr><th>function_name</th><th>roundId</th><th>iso_time</th><th>sender_address</th><th>fee_rate</th></tr>"
  for (let x in mine) {
    text += "<tr>"+
      "<td>" + 
      "mine" + 
      "</td>" +
      "<td>" + 
      mine[x].roundId + 
      "</td>"+
      "<td>" + 
      mine[x].receipt_time_iso + 
      "</td>" +
      "<td>" + 
      mine[x].sender_address + 
      "</td>" +
      "<td>" + 
      mine[x].fee_rate + 
      "</td>" +
      "</tr>";
  }
  for (let x in claims) {
    text += "<tr>"+
      "<td>" + 
      "claim-mining-reward" + 
      "</td>" +
      "<td>" + 
      claims[x].roundId + 
      "</td>"+
      "<td>" + 
      claims[x].receipt_time_iso + 
      "</td>" +
      "<td>" + 
      claims[x].sender_address + 
      "</td>" +
      "<td>" + 
      claims[x].fee_rate + 
      "</td>" +
      "</tr>";
  }
  for (let x in payout) {
    text += "<tr>"+
      "<td>" + 
      "payout-mia" + 
      "</td>" +
      "<td>" + 
      payout[x].roundId + 
      "</td>"+
      "<td>" + 
      payout[x].receipt_time_iso + 
      "</td>" +
      "<td>" + 
      payout[x].sender_address + 
      "</td>" +
      "<td>" + 
      payout[x].fee_rate + 
      "</td>" +
      "</tr>";
  }
  text += "</table>"

  return new Response(text, init)
}

addEventListener("fetch", event => {
  return event.respondWith(handleRequest())
})
