```
# 🎓 Démocratie Quiz – QCM interactif

Démocratie Quiz est un jeu de questions à choix multiples (QCM) permettant de tester ses connaissances sur la démocratie, les institutions, la citoyenneté et la vie publique.  
Le projet inclut un système de niveaux, un thème clair/sombre, un affichage dynamique des questions et un suivi du score.

---

## 🚀 Fonctionnalités

### ✔️ Interface moderne
- Page d’accueil avec logo, titre et sous‑titre
- Bouton **Commencer**

### ✔️ Quiz interactif
- Affichage d’une question à la fois
- 4 réponses possibles
- Sélection visuelle de la réponse
- Bouton **Valider**
- Fléche passer
- Fléche retour
- Feedback immédiat :
  - Réponse correcte (vert)
  - Réponse incorrecte (rouge)
- Définition / explication affichée après validation
- Bouton **Question suivante**

### ✔️ Score et progression
- Score affiché en haut
- Nombre de questions restantes

### ✔️ Thème clair / sombre
- Basculer entre les deux thèmes
- Couleurs adaptées automatiquement
- Jaune conservé pour les réponses (accent)
- Texte toujours lisible dans les deux thèmes

### ✔️ Navigation
- Bouton **Retour à l’accueil** à la fin du quiz
- Réinitialisation propre de l’interface

---

## 📁 Structure du projet
```
/quizqcm
│── index.html
│── style.css
│── script.js
│── questions.json
│── Demo_Quiz_bleu.png
|__ LogoPiedDePage.png
│── README.md

```
---

## 🧠 Fonctionnement technique

### 🔹 Chargement des questions
Les questions sont stockées dans un fichier `questions.json` et chargées via `fetch()` dans `script.js`.

### 🔹 Logique du quiz
- Mélange des questions
- Gestion du niveau choisi
- Vérification de la réponse
- Mise à jour du score
- Affichage des explications

### 🔹 Thème sombre
Le thème sombre repose sur des variables CSS (`:root` et `body.dark`) et modifie uniquement les couleurs de texte pour conserver la lisibilité.

---

## 🛠️ Installation et lancement

1. Télécharger ou cloner le projet :
   ```bash
   git clone https://github.com/pierre1006/quizqcm.git
```