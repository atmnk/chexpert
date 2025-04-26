import { AnthropicInput, ChatAnthropic } from "@langchain/anthropic";
import { BaseLanguageModelInput } from "@langchain/core/language_models/base";
import { BaseChatModelCallOptions, BaseChatModelParams } from "@langchain/core/language_models/chat_models.js";
import { AIMessageChunk } from "@langchain/core/messages";
import { Runnable } from "@langchain/core/runnables";
import { StructuredTool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIChatInput } from "@langchain/google-genai";
import { AzureChatOpenAI, AzureOpenAIInput, ChatOpenAI, ChatOpenAIFields, ClientOptions, OpenAIChatInput } from "@langchain/openai";
import { Page } from "playwright-core";

import { z } from "zod";
class NavigateTool extends StructuredTool {
    schema = z.object({
        url: z.string()
    });

    name = "navigate_to_url";

    description =
        "This tool navigates to given url";

    async _call(args: z.infer<this["schema"]>): Promise<string> {
        return "navigate_to_url"
    }
}
class ClickTool extends StructuredTool {
    schema = z.object({
        ref: z.string().describe('Exact target element reference from the page snapshot'),
    });

    name = "click_on_element";

    description =
        "This tool clicks on element";

    async _call(args: z.infer<this["schema"]>): Promise<string> {
        return "click_on_element"
    }
}
class DragDropTool extends StructuredTool {
    schema = z.object({
        sourceRef: z.string().describe('Exact source element reference from the page snapshot which needs to be dragged'),
        targetRef: z.string().describe('Exact target element reference from the page snapshot where source element needs to be dropped'),
    });

    name = "drag_element_and_drop_on_element";

    description =
        "This tool drags source element and drop it to target element";

    async _call(args: z.infer<this["schema"]>): Promise<string> {
        return "drag_element_and_drop_on_element"
    }
}
class FillTextTool extends StructuredTool {
    schema = z.object({
        ref: z.string().describe('Exact target element reference from the page snapshot'),
        text: z.string(),
    });

    name = "fill_text_in_element";

    description =
        "This tool fills provided text in element";

    async _call(args: z.infer<this["schema"]>): Promise<string> {
        return "fill_text_in_element"
    }
}
class CheckIfVisible extends StructuredTool {
    schema = z.object({
        ref: z.string().describe('Exact target element reference from the page snapshot'),
    });

    name = "assert_if_element_is_visible";

    description =
        "This tool asserts if element is visible use this tool only when it is explicitly mentioned to check. pass ref from provided html snapshot or pass ref as null as argument";

    async _call(args: z.infer<this["schema"]>): Promise<string> {
        return "assert_if_element_is_visible"
    }

}
type GoogleModelInitializationParams = {
    provider: "google";
    fields?: GoogleGenerativeAIChatInput;
}
type AnthropicModelInitializationParams = {
    provider: "anthropic";
    fields?: AnthropicInput & BaseChatModelParams;
}
type AzureOpenAIModelInitializationParams = {
    provider: "azure-openai";
    fields?: Partial<OpenAIChatInput> & Partial<AzureOpenAIInput> & {
        openAIApiKey?: string;
        openAIApiVersion?: string;
        openAIBasePath?: string;
        deploymentName?: string;
    } & BaseChatModelParams & {
        configuration?: ClientOptions;
    }
}
type OpenAIModelInitializationParams = {
    provider: "openai";
    fields?: ChatOpenAIFields;
}
type ModelInitializationParams = AzureOpenAIModelInitializationParams | GoogleModelInitializationParams | AnthropicModelInitializationParams | OpenAIModelInitializationParams
export class AI {
    private started: boolean
    private debug: boolean
    private page: Page
    private model: Runnable<BaseLanguageModelInput, AIMessageChunk, BaseChatModelCallOptions>

    constructor(page: Page, modelInitializationParams: ModelInitializationParams, debug = false) {
        this.started = false
        this.debug = debug
        this.page = page;
        const tools = [new NavigateTool(), new ClickTool(), new FillTextTool(), new CheckIfVisible(), new DragDropTool()]
        switch (modelInitializationParams.provider) {
            case "google":
                const model1 = new ChatGoogleGenerativeAI(modelInitializationParams.fields);
                this.model = model1.bind({
                    tools,
                });
                break
            case "anthropic":
                const model2 = new ChatAnthropic(modelInitializationParams.fields);
                this.model = model2.bind({
                    tools,
                });
                break
            case "azure-openai":
                const model3 = new AzureChatOpenAI(modelInitializationParams.fields);
                this.model = model3.bind({
                    tools,
                });
                break
            case "openai":
                const model4 = new ChatOpenAI(modelInitializationParams.fields);
                this.model = model4.bind({
                    tools,
                });
                break
            default:
                throw Error("Invalid provider")
        }
    }
    setPage(page: Page) {
        this.page = page
    }
    private async tce(page: Page, prompt: string, pollingInterval: number = 1000, iterations: number = 20, attempt: number = 0, scrollIfRequired: boolean = false) {
        if (!this.started) {
            if (this.debug) {
                console.log("Sending System Prompt")
            }
            await this.model.invoke([
                "system",
                "You are driver agent that drives automation specified in plain english, You have access to tools to accomplish steps provided subsequently during each interaction tools will execute code on playwright page and provide aria snapshot with of all elements your response should be only tool calls and no other text. You can send multiple tool calls in a single response."
            ])
            this.started = true
            if (this.debug) {
                console.log("Done Sending System Prompt")
            }
        }
        if (this.debug) {
            console.log("Started Taking Snapshot")
        }
        const snapshot = await this.page.locator('body').ariaSnapshot({
            ref: true,
        })
        const str = snapshot
        try {
            var start = new Date().getTime()
            if (this.debug) {
                console.log("Snapshot: ", str)
            }
            const res = await this.model.invoke([
                [
                    "human",
                    "Step: " +
                    prompt + "\nAria Snapshot from playwright:\n"
                    + (str == "" ? "empty page" : str)
                ],
            ]);

            var end = new Date().getTime()
            if (this.debug) {
                console.log("AI Response: ", res)
                console.log("Time Taken: " + ((end - start) / 1000))
            }
            for (const call of res.tool_calls) {
                switch (call.name) {
                    case "navigate_to_url":
                        await page.goto(call.args.url)
                        break
                    case "click_on_element":
                        await page.click(`aria-ref=${call.args.ref}`)
                        break
                    case "fill_text_in_element":
                        await page.fill(`aria-ref=${call.args.ref}`, call.args.text)
                        break
                    case "assert_if_element_is_visible":
                        return !(call.args.ref == null || call.args.ref == undefined)
                    case "drag_element_and_drop_on_element":
                        const sourceRef = call.args.sourceRef
                        const targetRef = call.args.targetRef
                        await page.dragAndDrop(`aria-ref=${sourceRef}`, `aria-ref=${targetRef}`)
                        break
                }
            }
        } catch (e) {
            console.log(e)
        }
    }
    async do(prompt: string, scrollIfRequired: boolean = false) {
        console.log("Performing: " + prompt)
        await this.tce(this.page, prompt, undefined, undefined, undefined, scrollIfRequired)
    }
    async waitForVisible(prompt: string, pollingInterval: number = 1000, iterations: number = 20, scrollIfRequired: boolean = false) {
        console.log("Waiting for: " + prompt + " to be visible")
        for (var i = 0; i < iterations; i++) {
            if (await this.tce(this.page, `Check if ${prompt} is visible in below elements don't consider past chat history`, pollingInterval, iterations, 0, scrollIfRequired)) {
                return
            }
            else {
                await this.page.waitForTimeout(pollingInterval)
            }
        }
    }
    async waitForNotVisible(prompt: string, pollingInterval: number = 1000, iterations: number = 20, scrollIfRequired: boolean = false) {
        console.log("Waiting for: " + prompt + " to be not visible")
        for (var i = 0; i < iterations; i++) {
            if (await this.tce(this.page, `Check if ${prompt} is visible in below elements don't consider past chat history`, pollingInterval, iterations, 0, scrollIfRequired)) {
                await this.page.waitForTimeout(pollingInterval)
            } else {
                return
            }
        }
    }
    async isVisible(prompt: string, pollingInterval: number = 1000, iterations: number = 20, scrollIfRequired: boolean = false) {
        console.log("Checking if : " + prompt + " is visible")
        for (var i = 0; i < iterations; i++) {
            if (await this.tce(this.page, `Check if ${prompt} is visible`, pollingInterval, iterations, 0, scrollIfRequired)) {
                return true
            }
            else {
                await this.page.waitForTimeout(pollingInterval)
            }
        }
        return false;
    }
}
