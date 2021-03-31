import { Client, Provider, ProviderRegistry, Result } from "@blockstack/clarity" 
import { assert, expect } from "chai" 
describe("hugs contract test suite", () => {
  let hugsClient: Client 
  let provider: Provider 
  before(async () => {
    provider = await ProviderRegistry.createProvider() 
    hugsClient = new Client("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB.hugs", "hugs", provider) 
  }) 
  it("should have a valid syntax", async () => {
    await hugsClient.checkContract() 
  }) 
  describe("deploying an instance of the contract", () => {
    const getLastTokenId = async () => {
      const query = hugsClient.createQuery({
        method: { name: "get-last-token-id", args: [] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      return Result.unwrapUInt(receipt) 
    }
    const getBalance = async (owner: string) => {
      const query = hugsClient.createQuery({
        method: { name: "get-balance", args: [`'${owner}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      return receipt.result 
    }
    const getOwner= async (id: number) => {
      const query = hugsClient.createQuery({
        method: { name: "get-owner", args: [`u${id}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      return Result.unwrap(receipt) 
    }
    const getErrStr = async (code: number) => {
      const query = hugsClient.createQuery({
        method: { name: "get-errstr", args: [`u${code}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      const result = Result.unwrap(receipt) 
      return result 
    }
    const getTokenUri = async (id: number) => {
      const query = hugsClient.createQuery({
        method: { name: "get-token-uri", args: [`u${id}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      const result = Result.unwrap(receipt) 
      return result 
    }
    const isSpenderApproved = async (id: number, spender: string) => {
      const query = hugsClient.createQuery({
        method: { name: "is-spender-approved", args: [`u${id}`, `'${spender}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      const result = Result.unwrap(receipt) 
      return result 
    }
    const isOperatorApproved = async (owner: string, operator: string) => {
      const query = hugsClient.createQuery({
        method: { name: "is-operator-approved", args: [`'${owner}`, `'${operator}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      const result = Result.unwrap(receipt) 
      return result 
    }
    const  getTokenId = async (uri: string) => {
      const query = hugsClient.createQuery({
        method: { name: "get-token-id", args: [`\"${uri}\"`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      const result = Result.unwrap(receipt) 
      return result 
    }
    const  getTokenMetadata = async (id: number) => {
      const query = hugsClient.createQuery({
        method: { name: "get-token-metadata", args: [`u${id}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      const result = Result.unwrap(receipt) 
      return result 
    }
    const  getGroupMetadata = async (id: number) => {
      const query = hugsClient.createQuery({
        method: { name: "get-group-metadata", args: [`u${id}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      const result = Result.unwrap(receipt) 
      return result 
    }
    const  getTokenByIndex = async (groupid: number, index: number) => {
      const query = hugsClient.createQuery({
        method: { name: "get-token-by-index", args: [`u${groupid}`, `u${index}`] }
      }) 
      const receipt = await hugsClient.submitQuery(query) 
      const result = Result.unwrap(receipt) 
      return result 
    }
    const execMethod = async (
      method: string, 
      args: string[] = [], sender: string = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7") => {
      const tx = hugsClient.createTransaction({
        method: {
          name: method,
          args: args,
        },
      }) 
      await tx.sign(sender)
      const receipt = await hugsClient.submitTransaction(tx) 
      return receipt 
    }
    before(async () => {
      await hugsClient.deployContract() 
    }) 
    it("should start at zero - get-last-token-id", async () => {
      const lastTokenId = await getLastTokenId() 
      assert.equal(lastTokenId, 0) 
    })
    it("should start at zero - get-balance", async () => {
      const balance = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7") 
      assert.equal(balance, "u0") 
    })
    it("should return 'sender does not own the asset' - getErrStr", async () => {
      const errstr = await getErrStr(1) 
      assert.equal(errstr, '(ok (some "sender does not own the asset"))')
    })
    it("should return 'none' - getErrStr", async () => {
      const errstr = await getErrStr(0) 
      assert.equal(errstr, '(ok none)') 
    })
    it("should return a token id u1 - mint", async () => {
      const receipt = await execMethod(
        'mint', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`,
         "\"test\"", 
         "u0"]) 
      expect(receipt.success).true
      expect(receipt.result).contains("u1")
      const balance = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      expect(balance).eq("u1")
    })
    it("should return u18 - mint", async () => {
      const receipt = await execMethod(
        'mint', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`,
         "\"\"", 
         "u0"]) 
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u18")
    })
    it("should return token ids (u2 u3) - mint-batch", async () => {
      const receipt = await execMethod(
        'mint-batch', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`,
         "(some { id: none, uri: (some \"test group\")})", 
         "(list { uri: \"test1\" } { uri: \"test2\" })"])
      expect(receipt.success).true
      expect(receipt.result).contains(`(u2 u3)`)
      const balance = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      expect(balance).eq("u3")
    })
    it("should return token ids (u4 u5) - mint-batch", async () => {
      const receipt = await execMethod(
        'mint-batch', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`,
         "(some { id: (some u1), uri: none })", 
         "(list { uri: \"test4\" } { uri: \"test5\" })"])
      expect(receipt.success).true
      expect(receipt.result).contains(`(u4 u5)`)
      const balance = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      expect(balance).eq("u5")
    })
    it("should return token ids (u6 u7) - mint-batch", async () => {
      const receipt = await execMethod(
        'mint-batch', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`,
         "none", 
         "(list { uri: \"test6\" } { uri: \"test7\" })"]) 
      expect(receipt.success).true
      expect(receipt.result).contains(`(u6 u7)`)
      const balance = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      expect(balance).eq("u7")
    })
    it("should return u8 - mint-batch", async () => {
      const receipt = await execMethod(
        'mint-batch', 
        [`'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`,
         "(some { id: none, uri: (some \"test\")})", 
         "(list { uri: \"test8\" } { uri: \"test9\" })"]) 
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u8")
    })
    it("should return true - transfer", async () => {
      const balance1 = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      const balance2 = await getBalance("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      const receipt = await execMethod(
        'transfer', 
        ["u2",
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`])
      expect(receipt.success).true
      const newBalance1 = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      const newBalance2 = await getBalance("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(newBalance1).eq(`u${parseInt(balance1.replace("u", "")) - 1}`)
      expect(newBalance2).eq(`u${parseInt(balance2.replace("u", "")) + 1}`)
    })
    it("should return u12 - transfer", async () => {
      const receipt = await execMethod(
        'transfer', 
        ["u2",
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`])
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u12")
    })
    it("should return u1 - transfer", async () => {
      const receipt = await execMethod(
        'transfer', 
        ["u2",
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`])
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u1")
    })
    it("should return u2 - transfer", async () => {
      const receipt = await execMethod(
        'transfer', 
        ["u2",
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`], "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u2")
    })
    it("should return (count u2) - transfer-batch", async () => {
      const balance1 = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      const balance2 = await getBalance("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      const receipt = await execMethod(
        'transfer-batch', 
        ["(list u6 u7)",
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`])
      expect(receipt.success).true
      expect(JSON.stringify(receipt)).contains("(count u2)")
      const newBalance1 = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      const newBalance2 = await getBalance("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(newBalance1).eq(`u${parseInt(balance1.replace("u", "")) - 2}`)
      expect(newBalance2).eq(`u${parseInt(balance2.replace("u", "")) + 2}`)
      const owner6 = await getOwner(6)
      const owner7 = await getOwner(7)
      expect(owner6).contains("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(owner7).contains("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
    })
    it("should return none - get-owner", async () => {
      const owner = await getOwner(99) 
      expect(owner).contains("none")
    })
    it("should return token uri - get-token-uri", async () => {
      const tokenUri = await getTokenUri(7) 
      expect(tokenUri).contains("test7")
    })
    it("should return none - get-token-uri", async () => {
      const tokenUri = await getTokenUri(99) 
      expect(tokenUri).contains("none")
    })
    it("should return none - get-id-by-uri", async () => {
      const id = await  getTokenId("test7") 
      expect(id).eq("u7")
    })
    it("should return 7 - get-last-token-id", async () => {
      const lastTokenId = await getLastTokenId() 
      assert.equal(lastTokenId, 7) 
    })
    it("should return token metadata - get-token-metadata", async () => {
      const metadata = await getTokenMetadata(7) 
      expect(JSON.stringify(metadata)).contains("test7")
    })
    it("should return none- get-token-metadata", async () => {
      const metadata = await getTokenMetadata(99) 
      expect(JSON.stringify(metadata)).eq("\"none\"")
    })
    it("should return group metadata - get-group-metadata", async () => {
      const metadata = await getGroupMetadata(99) 
      expect(JSON.stringify(metadata)).eq("\"none\"")
    })
    it("should return token data - get-token-by-index", async () => {
      const metadata = await getTokenByIndex(1, 1) 
      const metadataString = JSON.stringify(metadata)
      expect(metadataString).contains("test1")
      expect(metadataString).contains("(id u2)")
    })
    it("should return none - get-token-by-index", async () => {
      const metadata = await getTokenByIndex(99, 99) 
      expect(JSON.stringify(metadata)).contains("\"none\"")
    })
    it("should return the spender - is-spender-approved", async () => {
      const spenderApproval = await isSpenderApproved(7, "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      expect(`${spenderApproval}`).eq('false')
    })
    it("should return the operator - is-operator-approved", async () => {
      const spenderApproval = await isOperatorApproved(
        "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB", 
        "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      expect(`${spenderApproval}`).eq('false')
    })
    it("should return true - set-spender-approval", async () => {
      const receipt = await execMethod(
        'set-spender-approval', 
        ["u2",
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `true`], "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(receipt.success).true
      const spenderApproval = await isSpenderApproved(2, "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      expect(`${spenderApproval}`).eq('true')
    })
    it("should return true - transfer by spender", async () => {
      const balance1 = await getBalance("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      const balance2 = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      const receipt = await execMethod(
        'transfer', 
        ["u2",
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`])
      expect(receipt.success).true
      const newBalance1 = await getBalance("SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      const newBalance2 = await getBalance("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7")
      expect(newBalance1).eq(`u${parseInt(balance1.replace("u", "")) - 1}`)
      expect(newBalance2).eq(`u${parseInt(balance2.replace("u", "")) + 1}`)
    })
    it("should return u13 - set-spender-approval", async () => {
      const receipt = await execMethod(
        'set-spender-approval', 
        ["u2",
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `true`], "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u13")
    })
    it("should return u17 - set-spender-approval - same spender", async () => {
      const receipt = await execMethod(
        'set-spender-approval', 
        ["u2",
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `true`])
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u17")
    })
    it("should remove approval - set-spender-approval - false", async () => {
      let spenderApproval = await isSpenderApproved(2, "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(`${spenderApproval}`).eq('false')
      let receipt = await execMethod(
        'set-spender-approval', 
        ["u2",
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `false`])
      expect(receipt.success).true
      spenderApproval = await isSpenderApproved(2, "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(`${spenderApproval}`).eq('false')
      receipt = await execMethod(
        'set-spender-approval', 
        ["u2",
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `true`])
      expect(receipt.success).true
      spenderApproval = await isSpenderApproved(2, "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(`${spenderApproval}`).eq('true')
      receipt = await execMethod(
        'set-spender-approval', 
        ["u2",
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `false`])
      expect(receipt.success).true
      spenderApproval = await isSpenderApproved(2, "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(`${spenderApproval}`).eq('false')
      receipt = await execMethod(
        'transfer', 
        ["u2",
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`], "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u12")
    })
    it("should set the operator - set-operator-approval", async () => {
      let operatorApproval = await isOperatorApproved(
        "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7",
         "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(`${operatorApproval}`).eq('false')
      let receipt = await execMethod(
        'set-operator-approval', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `false`])
      expect(receipt.success).true
      operatorApproval = await isOperatorApproved(
        "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", 
        "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(`${operatorApproval}`).eq('false')
      receipt = await execMethod(
        'set-operator-approval', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`,  
        `true`])
      expect(receipt.success).true
      operatorApproval = await isOperatorApproved(
        "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", 
        "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(`${operatorApproval}`).eq('true')
    })
    it("should transfer any token owned by owner - set-operator-approval", async () => {
      let receipt = await execMethod(
        'transfer', 
        ["u3",
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`], "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(receipt.success).true
      receipt = await execMethod(
        'transfer', 
        ["u4",
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`], "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(receipt.success).true
      receipt = await execMethod(
        'set-operator-approval', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`, 
        `false`])
      expect(receipt.success).true
      let operatorApproval = await isOperatorApproved("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", 
      "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(`${operatorApproval}`).eq('false')
      receipt = await execMethod(
        'transfer', 
        ["u5",
        `'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`, 
        `'SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB`], "SP3GWX3NE58KXHESRYE4DYQ1S31PQJTCRXB3PE9SB")
      expect(receipt.success).false
      expect(JSON.stringify(receipt)).contains("Aborted: u12")
    })
    it("should return 30 token ids - mint-batch", async () => {
      const receipt = await execMethod(
        'mint-batch', 
        [`'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7`,
         "none", 
         "(list " + 
         "{ uri: \"test31\" } " +
         "{ uri: \"test32\" } " +
         "{ uri: \"test33\" } " +
         "{ uri: \"test34\" } " +
         "{ uri: \"test35\" } " +
         "{ uri: \"test36\" } " +
         "{ uri: \"test37\" } " +
         "{ uri: \"test38\" } " +
         "{ uri: \"test39\" } " +
         "{ uri: \"test40\" } " +
         "{ uri: \"test11\" } " +
         "{ uri: \"test12\" } " +
         "{ uri: \"test13\" } " +
         "{ uri: \"test14\" } " +
         "{ uri: \"test15\" } " +
         "{ uri: \"test16\" } " +
         "{ uri: \"test17\" } " +
         "{ uri: \"test18\" } " +
         "{ uri: \"test19\" } " +
         "{ uri: \"test20\" } " +
         "{ uri: \"test21\" } " +
         "{ uri: \"test22\" } " +
         "{ uri: \"test23\" } " +
         "{ uri: \"test24\" } " +
         "{ uri: \"test25\" } " +
         "{ uri: \"test26\" } " +
         "{ uri: \"test27\" } " +
         "{ uri: \"test28\" } " +
         "{ uri: \"test29\" } " +
        "{ uri: \"test30\" })"]) 
      expect(receipt.success).true
      expect(receipt.result).contains(
        "(u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19 u20 u21 u22 u23 u24 u25 u26 u27 u28 u29 u30 u31 u32 u33 u34 u35 u36 u37)")
    })
  }) 
  after(async () => {
    await provider.close() 
  }) 
}) 
