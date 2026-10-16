package scriptfuse

import com.microsoft.playwright.BrowserType
import com.microsoft.playwright.Page
import com.microsoft.playwright.Playwright
import com.microsoft.playwright.options.WaitForSelectorState
import java.util.regex.Pattern

private fun resource(name: String): String =
    object {}.javaClass.getResourceAsStream("/$name")?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }
        ?: error("Missing resource: $name. Compile the automation project first.")

fun main(args: Array<String>) {
    if ("--help" in args) {
        println("Options: --package quickScript|booking|custom --language fr|en --images --review --base-url URL --channel chrome|msedge --smoke")
        return
    }
    val options = Options.parse(args)
    if (options.smoke) {
        smoke(options)
        return
    }
    val localSite = if (options.baseUrl == null) LocalSite(LocalSite.findSourceDirectory()) else null
    try {
        val base = (options.baseUrl ?: localSite!!.baseUrl).trimEnd('/') + "/"
        Playwright.create().use { playwright ->
            val launch = BrowserType.LaunchOptions().setHeadless(false)
            options.channel?.let { launch.setChannel(it) }
            playwright.chromium().launch(launch).use { browser ->
                browser.newContext().use { context ->
                    val page = context.newPage()
                    page.setDefaultTimeout(30_000.0)
                    page.navigate(base + "login.html")
                    page.evaluate("language => localStorage.setItem('scriptfuse-language', language)", options.language)
                    page.reload()
                    val email = System.getenv("SCRIPTFUSE_TEST_EMAIL")
                    val password = System.getenv("SCRIPTFUSE_TEST_PASSWORD")
                    require(email.isNullOrBlank() == password.isNullOrBlank()) { "Set both test email and password, or neither" }
                    if (!email.isNullOrBlank() && !password.isNullOrBlank()) {
                        page.locator("#emailAddress").fill(email)
                        page.locator("#passWord").fill(password)
                        page.locator("#loginBtn").click()
                    } else {
                        println("Connectez-vous dans le navigateur avec votre compte de test (5 minutes).")
                    }
                    page.waitForURL(Pattern.compile(".*/userDashboard\\.html(?:[?#].*)?$"), Page.WaitForURLOptions().setTimeout(300_000.0))
                    // Dashboard rendering confirms authentication and the role request have completed.
                    page.waitForFunction("() => document.querySelector('#dashboardUserName')?.textContent.trim().length > 0")
                    page.navigate(base + "quickScriptPackage.html?package=" + options.packageId)
                    val signedIn = page.evaluate("""async () => {
                        const script = Array.from(document.scripts).find(script =>
                            new URL(script.src || location.href).pathname.endsWith('/firebase.js'));
                        if (!script) throw new Error('Firebase module not found');
                        const {auth} = await import(script.src);
                        await auth.authStateReady();
                        return Boolean(auth.currentUser);
                    }""")
                    check(signedIn == true) { "Authentication was lost when opening the brief" }
                    page.waitForFunction("""() => {
                        const form = document.querySelector('#quickScriptForm');
                        const title = document.querySelector('#packageBriefTitle');
                        const id = new URLSearchParams(location.search).get('package');
                        const keys = {quickScript:'basicWebsiteTitle', booking:'bookingRequirementsTitle', custom:'customRequirementsTitle'};
                        return form && !form.hidden && title?.dataset.key === keys[id]
                          && document.querySelector('#lang-toggle')?.getAttribute('aria-label');
                    }""")
                    fill(page, options.images)
                    if (options.review) {
                        page.locator("#submitBrief").click()
                        page.locator("#briefReview").waitFor()
                        page.locator("#confirmBrief").waitFor()
                        check(page.locator("#briefReviewDetails").textContent().contains("TEST - Maple Studio"))
                    }
                    println("Formulaire rempli (${options.packageId}). Aucune demande envoyee automatiquement.")
                    println("Le navigateur reste ouvert pour verification. Fermez-le pour terminer.")
                    // Playwright continues dispatching browser events while waiting.
                    runCatching {
                        page.locator("html").waitFor(
                            com.microsoft.playwright.Locator.WaitForOptions()
                                .setState(WaitForSelectorState.DETACHED).setTimeout(86_400_000.0)
                        )
                    }
                }
            }
        }
    } finally {
        localSite?.close()
    }
}

private fun fill(page: Page, images: Boolean) {
    // Load the same JavaScript fixture used from the browser console.
    page.evaluate(resource("dev/fill-brief.js"))
    val result = page.evaluate("images => window.fillScriptFuseBrief({overwrite: true, images})", images) as Map<*, *>
    check(result["valid"] == true) { "Invalid fields: ${result["invalidFields"]}" }
}

/** Uses the real form and package configuration, without Firebase, credentials, or network writes. */
private fun smoke(options: Options) {
    Playwright.create().use { playwright ->
        val launch = BrowserType.LaunchOptions().setHeadless(true)
        options.channel?.let { launch.setChannel(it) }
        playwright.chromium().launch(launch).use { browser ->
            val page = browser.newPage()
            page.route("**/*") { it.abort() }
            val html = resource("quickScriptPackage.html")
                .replace(Regex("<script\\b[^>]*>[\\s\\S]*?</script>", RegexOption.IGNORE_CASE), "")
            val config = resource("packages.js").replace("export ", "")
            for (id in listOf("quickScript", "booking", "custom")) {
                page.setContent(html)
                page.evaluate("""id => {
                    $config
                    configurePackageFields(document.querySelector('#quickScriptForm'), id);
                }""", id)
                page.evaluate("""() => {
                    window.testSubmissions = 0;
                    document.querySelector('#quickScriptForm').addEventListener('submit', event => {
                        event.preventDefault(); window.testSubmissions++;
                    });
                }""")
                fill(page, images = true)
                check(page.locator("#companyName").inputValue() == "TEST - Maple Studio")
                check(page.locator("#contentReadiness").inputValue() == "write-for-me")
                check(page.evaluate("() => document.querySelector('#logoFile').files[0].type") == "image/png")
                check(page.evaluate("() => window.testSubmissions") == 0)
                if (id != "quickScript") {
                    val field = if (id == "booking") "bookingRequirements" else "customRequirements"
                    check(page.locator("#$field").inputValue().isNotBlank())
                }
                page.locator("#companyName").fill("Keep my existing text")
                page.evaluate("() => window.fillScriptFuseBrief()")
                check(page.locator("#companyName").inputValue() == "Keep my existing text")
                println("PASS: $id - valid form, package fields, generated images, existing values preserved, no submission")
            }
        }
    }
}
