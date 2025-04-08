import Groq from 'groq-sdk'
import { GetResult, SendTest } from '../../services/open_router_chat_api'
import { beforeEach, describe, expect } from 'vitest'

describe("Retrieving Result", () => {

    beforeEach( () => {

        


    })


    test("Retrieving The Valid Result" , async() => {
        const usrResponse = "Question: Do You Have Anxiety? Answer: Yes";
        const tags = ['Anxiety']
        SendTest.mockAcceptedValue("accepted");

        const response = await GetResult(usrResponse, tags);
        expect(GetResult).toBeCalledWith(usrResponse, tags);

    })





})

