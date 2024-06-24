const puppeteer = require("puppeteer");
const setTimeouts = (milliseconds) =>
    new Promise((r) => setTimeout(r, milliseconds));
const {
    writeFileSync
} = require("fs");

(async () => {
    // Launch the browser and open a new blank page
    const totalDetails = [];
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--disable-setuid-sandbox",
            "--no-first-run",
            "--no-sandbox",
            "--no-zygote",
        ],
    });
    const context = browser.defaultBrowserContext();
    //        URL                  An array of permissions
    context.overridePermissions("https://www.tripadvisor.com", [
        "geolocation",
        "notifications",
    ]);
    const page = await browser.newPage();
    await page.setGeolocation({
        latitude: -7.797068,
        longitude: 110.370529
    });

    // Navigate the page to a URL
    await page.goto(
        "https://www.tripadvisor.com/Search?q=coffee%20%26%20tea&ssrc=e&searchNearby=true&searchSessionId=001d06ef6faf0e59.ssid&sid=CE4DEB240E4745DB8E56F0FF5C8D44811691156273994&blockRedirect=true&geo=294230&rf=5"
    );
    const nextButtonSelector = '//a[text()="Next"]';
    let nextButton = await page.waitForXPath(nextButtonSelector);

    let index = 1;

    try {
        while (nextButton) {
            // Wait and click on first result
            if (index > 19) {
                const coffeCard = ".result-content-columns";
                await page.waitForSelector(coffeCard);
                const coffeElements = await page.$$(coffeCard);
                for (const coffe of coffeElements) {
                    try {
                        const detailProps = {};
                        try {
                            const styleValue = await coffe.$eval(".inner", (el) =>
                                el.getAttribute("style")
                            );
                            const regexp = new RegExp("https.*?jpg");
                            const result = regexp.exec(styleValue);
                            detailProps['image'] = result[0];
                        } catch (error) {
                            detailProps['image'] = '';
                        }
                        // console.log(surl)

                        await coffe.click();
                        await page.waitForTimeout(2000);

                        //ganti page
                        const pages = await browser.pages(); // get all pages
                        const page2 = pages.at(-1); // get the new page
                        await page.waitForTimeout(5000);

                        //GetSelectorAll anak di viewDetails
                        try {

                            try {
                                const cafeNameSelector = '//*[@data-test-target="top-info-header"]';
                                await page2.waitForXPath(cafeNameSelector, {
                                    timeout: 30000,
                                });
                                const cafeNameElement = await page2.$x(cafeNameSelector);
                                const cafeNameText = await (
                                    await cafeNameElement[0].getProperty("textContent")
                                ).jsonValue();
                                detailProps["cafeName"] = cafeNameText;
                            } catch (error) {
                                detailProps["cafeName"] = "";
                            }

                            
                            try {
                                const cafeAddress = '//*[@href="#MAPVIEW"]';
                            await page2.waitForXPath(cafeAddress, {
                                timeout: 2000,
                            });

                                const cafeAddressElement = await page2.$x(cafeAddress);
                                const cafeAddressText = await (
                                    await cafeAddressElement[0].getProperty("textContent")
                                ).jsonValue();
                                detailProps["cafeAddress"] = cafeAddressText;
                            } catch (error) {
                                detailProps["cafeAddress"] = "";
                            }

                            // const ratingSelector = '//*[@class=="ZDEqb"]/..';
                            // await page2.waitForXPath(ratingSelector, {
                            //     timeout: 2000
                            // });

                            // try {
                            //     const ratingElement = await page2.$x(ratingSelector);
                            //     const ratingText = await (await ratingElement[0].getProperty('textContent')).jsonValue()
                            //     detailProps['rating'] = ratingText
                            // } catch (e) {
                            //     detailProps['rating']  = ''
                            // }

                            try {
                                const ratingSelector = ".ZDEqb";
                                const ratingElement = await page2.$(ratingSelector);
                                const ratingText = await (
                                    await ratingElement.getProperty("textContent")
                                ).jsonValue();

                                detailProps['rating'] = ratingText

                            } catch (error) {
                                detailProps['rating'] = "";
                            }

                            // Wait and click on first result

                            const searchResultSelector = '//a[text()="View all details"]';
                            const details = await page2.waitForXPath(searchResultSelector);
                            console.log(details);
                            await details.click();

                            await page2.waitForTimeout(1000);

                            // detail
                            const parentSelector = '//*[@class="SrqKb"]/..';
                            await page2.waitForXPath(parentSelector, {
                                timeout: 2000,
                            });
                            const parentsElement = await page2.$x(parentSelector);

                            for (const child of parentsElement) {
                                const keySelector = ".tbUiL";
                                const keyElement = await child.$(keySelector);
                                const keyText = await (
                                    await keyElement.getProperty("textContent")
                                ).jsonValue();

                                const valueSelector = ".SrqKb";
                                const valueElement = await child.$(valueSelector);
                                const valueText = await (
                                    await valueElement.getProperty("textContent")
                                ).jsonValue();
                                detailProps[keyText.split(" ").join("_")] = valueText;
                            }
                            console.log(detailProps);
                        } catch (e) {
                            console.log(e);
                            await page2.close();
                            console.log("ga ada details");
                        }

                        //Dari anak cari parent alias DIV yg ngewrap itu

                        //Baru cari anak anaknya lagi yg sepasang(Title sama isinya)

                        totalDetails.push(detailProps);
                        // process the new page
                        await page2.close();
                    } catch (e) {
                        console.log(e);

                    }
                }
                writeFileSync(`./dump/${index}.json`, JSON.stringify(totalDetails));
            }

            index += 1;

            nextButton = await page.waitForXPath(nextButtonSelector);
            await nextButton.click();
        }
    } catch (error) {
        console.log(error);
    }
})();