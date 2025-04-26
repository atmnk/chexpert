# Chexpert
Chexpert is library which allows you to write locator less playwright tests using Generative AI.
This library underneath uses langchainjs and playwright.

## Example Usage With Google Gemini
### Generating Gemini API Key
Click on this link to get Gemini API Key https://ai.google.dev/gemini-api/docs/api-key

### Setting API Key
Best way to setup environment variable after generating key in VS Code is
Open Playwright Extension Page

Click on Gear icon then click on settings. Choose Workspace (For setting this in your current project only) or User (For setting this in your all projects). And click Edit Settings. Under playwright.env section add your key in following way

```json
{
    "playwright.env": {
        "GOOGLE_API_KEY":"Your API Key Here"
    },
}
```

### Using Library in code

You can create a fixture like below in file "fixture.ts"
```typescript
import { test as base } from '@playwright/test';
import { AI } from 'chexpert';
export const aiTest = base.extend<{ ai: AI }>({
    ai: async ({ page }, use) => {
        const ai = new AI(page,{
            provider: "google",
            fields:{
                model:"gemini-2.0-flash" // Or You can use any model that supports tool calls
            }
        });
        use(ai)
    }
})
```

You can then use this fixture in code like below

```typescript
import { aiTest } from './fixture';
aiTest('Sign up to wishmebest app', async ({ ai }) => {
  await ai.do(`navigate to 'https://wishmebest.netlify.app'`)
  await ai.do(`Click on signup button`)
  const d = new Date()
  const username = "user_" + d.getTime()
  await ai.do(`Enter username '${username}'`)
  const password = 'Test1234'
  await ai.do(`Enter password '${password}'`)
  await ai.do(`Enter confirm password ${password}`)
  await ai.do(`Click on signup button`)
  await ai.waitForVisible('Logout')
});
```

## Example Usage With Anthropic
### Generating Anthropic API Key
Click on this link to get Anthropic API Key https://console.anthropic.com/settings/keys
### Setting API Key
Best way to setup environment variable after generating key in VS Code is
Open Playwright Extension Page

Click on Gear icon then click on settings. Choose Workspace (For setting this in your current project only) or User (For setting this in your all projects). And click Edit Settings. Under playwright.env section add your key in following way

```json
{
    "playwright.env": {
        "ANTHROPIC_API_KEY":"Your API Key Here"
    }
}
```

### Using Library in code

You can create a fixture like below in file "fixture.ts"
```typescript
import { test as base } from '@playwright/test';
import { AI } from 'chexpert';
export const aiTest = base.extend<{ ai: AI }>({
    ai: async ({ page }, use) => {
        const ai = new AI(page,{
            provider: "anthropic",
            fields:{
                model:"claude-3-7-sonnet-latest" // Or You can use any model that supports tool calls
            }
        });
        use(ai)
    }
})
```

You can then use this fixture in code like below

```typescript
import { aiTest } from './fixture';
aiTest('Sign up to wishmebest app', async ({ ai }) => {
  await ai.do(`navigate to 'https://wishmebest.netlify.app'`)
  await ai.do(`Click on signup button`)
  const d = new Date()
  const username = "user_" + d.getTime()
  await ai.do(`Enter username '${username}'`)
  const password = 'Test1234'
  await ai.do(`Enter password '${password}'`)
  await ai.do(`Enter confirm password ${password}`)
  await ai.do(`Click on signup button`)
  await ai.waitForVisible('Logout')
});
```

## Example Usage With Azure Open AI
### Setting Up Environment Variables
Best way to setup environment variable after generating key in VS Code is
Open Playwright Extension Page

Click on Gear icon then click on settings. Choose Workspace (For setting this in your current project only) or User (For setting this in your all projects). And click Edit Settings. Under playwright.env section add your key in following way

```json
{
    "playwright.env": {
        "AZURE_OPENAI_API_KEY":"Your Token here",
        "AZURE_OPENAI_API_VERSION":"Your version of API",
        "AZURE_OPENAI_API_INSTANCE_NAME":"Your api instance name here",
        "AZURE_OPENAI_API_DEPLOYMENT_NAME":"Your deployment name here",
    }
}
```

### Using Library in code

You can create a fixture like below in file "fixture.ts"
```typescript
import { test as base } from '@playwright/test';
import { AI } from 'chexpert';
export const aiTest = base.extend<{ ai: AI }>({
    ai: async ({ page }, use) => {
        const ai = new AI(page,{
            provider: "openai"
        });
        use(ai)
    }
})
```

You can then use this fixture in code like below

```typescript
import { aiTest } from './fixture';
aiTest('Sign up to wishmebest app', async ({ ai }) => {
  await ai.do(`navigate to 'https://wishmebest.netlify.app'`)
  await ai.do(`Click on signup button`)
  const d = new Date()
  const username = "user_" + d.getTime()
  await ai.do(`Enter username '${username}'`)
  const password = 'Test1234'
  await ai.do(`Enter password '${password}'`)
  await ai.do(`Enter confirm password ${password}`)
  await ai.do(`Click on signup button`)
  await ai.waitForVisible('Logout')
});
```
