import { GetResult, SendTest } from '../../services/open_router_chat_api'
import { beforeEach, describe, expect, vi } from 'vitest'


describe("Retrieving Result", () => {

  beforeEach(() => {
    vi.clearAllMocks()  

  })
 

  test("Retrieving Valid Result", async () => {
    const usrResponse = "Question: Do You Have Anxiety? Answer: Yes";
    const tags = ['Anxiety']

   
    const response = await GetResult(usrResponse, tags);
    expect(response.length).toBeGreaterThan(0);
   
    
  })

  test("Retrieve Invalid Result", async () => {
    const usrResponse = "Question: Do You Have Anxiety? Answer: Yes";
    const tags = null

    const response = await GetResult(usrResponse, tags);
    expect(response).toEqual("No tags available")


  })
})
