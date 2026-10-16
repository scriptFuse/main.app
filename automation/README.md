# Automatisation Kotlin + JavaScript

Kotlin pilote Chromium avec Playwright Java. Le navigateur execute le meme
`src/dev/fill-brief.js` que le remplissage depuis la console : aucune copie des
donnees de test a maintenir. Les trois forfaits et les images de test sont pris
en charge.

## Lancer sous Windows

Prerequis : JDK 21 et Maven (celui fourni avec IntelliJ est detecte par le script).
Depuis la racine du depot :

```powershell
.\automation\run.ps1 -Task InstallBrowser
.\automation\run.ps1 -Package booking -Images -Review
```

Un serveur local est lance automatiquement, limite au dossier `src/`, sur
`127.0.0.1` et un port libre. Connectez-vous avec votre compte de test dans le
navigateur. Le script attend la connexion, ouvre le forfait et remplit les champs.
Le navigateur reste ouvert jusqu'a sa fermeture manuelle.

- `-Package quickScript|booking|custom` : forfait (Quick Script par defaut).
- `-Language fr|en` : langue (francais par defaut).
- `-Images` : genere et joint un logo PNG et une image de galerie.
- `-Review` : ouvre la revision du brief, sans cliquer sur Confirmer la demande.
- `-BaseUrl https://votre-site.example/src/` : utilise un serveur existant au lieu
  du serveur local. L'URL doit designer le dossier contenant `login.html`.
- `-Channel msedge` ou `-Channel chrome` : utilise un navigateur deja installe ;
  l'etape InstallBrowser n'est alors pas necessaire.
- `-MavenPath C:\chemin\mvn.cmd` : chemin explicite si Maven n'est pas detecte.

Pour automatiser aussi la connexion, definir `SCRIPTFUSE_TEST_EMAIL` et
`SCRIPTFUSE_TEST_PASSWORD` dans l'environnement de lancement. Les deux sont
facultatifs et ne sont ni stockes ni affiches par le programme. Ne pas les ajouter
au depot. Sans ces variables, la connexion se fait directement dans le navigateur.

La connexion Firebase locale doit autoriser `127.0.0.1` dans les domaines Auth du
projet. Si le navigateur affiche une erreur Firebase, verifier cette configuration
ou utiliser `-BaseUrl` avec une origine deja autorisee. Le serveur local utilise
la configuration Firebase existante : confirmer manuellement cree une vraie
demande dans le projet configure. Le programme ne confirme jamais une demande.

## IntelliJ

Importer `automation/pom.xml` comme projet Maven et choisir le JDK 21.
Lancer `scriptfuse.MainKt` avec, par exemple :

```text
--package custom --language fr --images --review --channel msedge
```

Le dossier de travail doit etre la racine du depot ou le dossier `automation`.
Avec le Chromium telecharge par `run.ps1`, definir aussi `PLAYWRIGHT_BROWSERS_PATH`
sur le chemin absolu `automation/.browsers`, ou utiliser `--channel msedge`.
Le script PowerShell conserve les dependances Maven et les navigateurs dans des
dossiers ignores par Git a l'interieur d'`automation`.

## Verifier sans compte et sans ecriture Firebase

```powershell
.\automation\run.ps1 -Task Test
.\automation\run.ps1 -Task Smoke
```

Test verifie les options et le serveur local. Smoke ouvre Chromium sans interface
et remplit les trois variantes du vrai formulaire, avec des PNG generes. Les
scripts Firebase sont retires de cette page de test et toutes les requetes reseau
du navigateur sont bloquees. Il verifie la validation HTML, les champs propres au
forfait, les fichiers joints, la conservation des valeurs et l'absence d'envoi.
Il ne remplace pas une verification de connexion et de revision avec Firebase.

References : [Playwright Java](https://playwright.dev/java/docs/intro),
[Kotlin avec Maven](https://kotlinlang.org/docs/maven.html).
