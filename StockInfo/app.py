import os
from datetime import timezone, datetime

from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from tempfile import mkdtemp
from werkzeug.exceptions import default_exceptions, HTTPException, InternalServerError
from werkzeug.security import check_password_hash, generate_password_hash

from helpers import apology, login_required, lookup, usd


# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True


# Ensure responses aren't cached
@app.after_request
def after_request(response):
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


# Custom filter
app.jinja_env.filters["usd"] = usd

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure CS50 Library to use SQLite database
db = SQL("sqlite:///finance.db")

# Make sure API key is set
if not os.environ.get("API_KEY"):
    raise RuntimeError("API_KEY not set")


@app.route("/")
@login_required
def index():
    """Show portfolio of stocks"""
    names = db.execute(
        "SELECT sname, symbol, quantity, price FROM purchases WHERE username = (SELECT username FROM users WHERE id = ?)", session["user_id"])
    for i in names:
        i["total"] = i["price"] * int(i["quantity"])
        i["price"] = usd(i["price"])
        i["total"] = usd(i["total"])

    userdata = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])
    userdata[0]["cash"] = usd(userdata[0]["cash"])
    return render_template("index.html", names=names, userdata=userdata)


@app.route("/addcash", methods=["POST"])
@login_required
def addcash():
    """Add cash to User Account"""
    if request.method == "POST":
        amount = request.form.get("amount")
        cash = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])
        new = int(amount) + cash[0]["cash"]
        if int(amount) < 1000:
            return apology("Invalid input", 400)
        db.execute("UPDATE users SET cash = ? WHERE id = ?", new, session["user_id"])
        return redirect("/")


@app.route("/buy", methods=["GET", "POST"])
@login_required
def buy():
    """Buy shares of stock"""
    if request.method == "POST":
        shares = request.form.get("shares")
        if not shares.isdigit():
            return apology("Invalid amount", 400)
        symbol = request.form.get("symbol")
        if not lookup(symbol):
            return apology("Invalid Stock symbol", 400)
        cash = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])
        stock = lookup(symbol)
        cost = int(shares) * stock["price"]
        if cost > cash[0]["cash"]:
            return apology("Insufficient Balance", 400)
        else:
            username = db.execute("SELECT username FROM users WHERE id = ?", session["user_id"])
            currTime = datetime.now()
            currTime.replace(tzinfo=timezone.utc) - currTime.astimezone(timezone.utc)
            s1 = currTime.strftime("%m/%d/%Y %H:%M:%S")
            updateCash = cash[0]["cash"] - cost
            db.execute("INSERT INTO purchases (username, symbol, price, quantity, date_time, sname) VALUES (?, ?, ?, ?, ?, ?)",
                       username[0]["username"], symbol, stock["price"], shares, s1, stock["name"])
            db.execute("INSERT INTO history (username, symbol, price, quantity, sname, action, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       username[0]["username"], symbol, stock["price"], shares, stock["name"], "buy", s1)
            db.execute("UPDATE users SET cash = ? WHERE id = ?", updateCash, session["user_id"])
            flash("Purchase of " + stock["name"] + " Shares Successful")
            return redirect("/")
    elif request.method == "GET":
        return render_template("buy.html")


@app.route("/history")
@login_required
def history():
    """Show history of transactions"""
    if request.method == "GET":
        symbol = db.execute("SELECT symbol, price, quantity, sname, action, date FROM history")
        return render_template("history.html", symbols=symbol)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()
    global f
    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 403)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 403)

        # Query database for username
        rows = db.execute("SELECT * FROM users WHERE username = ?", request.form.get("username"))

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(rows[0]["hash"], request.form.get("password")):
            return apology("invalid username and/or password", 403)

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]
        flash("Successfully Logged in!")

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""
    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/quote", methods=["GET", "POST"])
@login_required
def quote():
    """Get stock quote."""
    if request.method == "POST":
        symbol = request.form.get("symbol")
        if not lookup(symbol):
            return apology("Invalid Stock Symbol", 400)
        else:
            sym = lookup(symbol)
            sym["price"] = usd(sym["price"])
            return render_template("quoted.html", symbol=sym)
    elif request.method == "GET":
        return render_template("quote.html")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""
    if request.method == "POST":
        names = db.execute("SELECT username FROM users")
        name = request.form.get("username")
        password = request.form.get("password")
        confirmation = request.form.get("confirmation")
        for i in names:
            if name == i["username"]:
                return apology("Username already exists", 400)
        if not name:
            return apology("Please enter a username", 400)
        elif not password:
            return apology("Please enter a password ", 400)
        elif not confirmation:
            return apology("Please Re-enter password", 400)
        elif password != confirmation:
            return apology("Passwords do not match", 400)

        hashed = generate_password_hash(password, method='pbkdf2:sha256', salt_length=8)
        db.execute("INSERT INTO users (username, hash) VALUES (?, ?)", name, hashed)
        return redirect("/login")
    else:
        return render_template("register.html")


@app.route("/sell", methods=["GET", "POST"])
@login_required
def sell():
    """Sell shares of stock"""
    if request.method == "POST":
        global totalshare
        totalshare = 0
        symbol = request.form.get("symbol")
        if symbol == "None":
            return apology("Invalid Input", 400)
        shares = request.form.get("shares")
        name = db.execute(
            "SELECT symbol, quantity FROM purchases WHERE username = (SELECT username FROM users WHERE id = ?) AND symbol = ?", session["user_id"], symbol)
        for i in name:
            if i["symbol"] == symbol:
                totalshare += int(i["quantity"])
        if int(shares) > totalshare or int(shares) < 0:
            return apology("Invalid Quantity", 400)
        stock = lookup(symbol)
        cash = db.execute("SELECT cash FROM users WHERE id = ?", session["user_id"])
        username = db.execute("SELECT username FROM users WHERE id = ?", session["user_id"])
        updateCash = cash[0]["cash"] + (stock["price"] * int(shares))

        currTime = datetime.now()
        currTime.replace(tzinfo=timezone.utc) - currTime.astimezone(timezone.utc)
        s1 = currTime.strftime("%m/%d/%Y %H:%M:%S")
        db.execute("UPDATE users SET cash = ? WHERE id = ?", updateCash, session["user_id"])
        print(totalshare)
        db.execute("INSERT INTO history (username, symbol, price, quantity, sname, action, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
                   username[0]["username"], symbol, stock["price"], shares, stock["name"], "sell", s1)
        currQuantity = totalshare - int(shares)
        print(currQuantity)
        if currQuantity == 0:
            db.execute("DELETE FROM purchases WHERE username = (SELECT username FROM users WHERE id = ?) AND symbol = ?",
                       session["user_id"], symbol)
        else:
            db.execute("UPDATE purchases SET quantity = ? ,date_time = ? WHERE username = (SELECT username FROM users WHERE id = ?) AND symbol = ?",
                       currQuantity, s1, session["user_id"], symbol)
        totalshare = 0
        return redirect("/")

    elif request.method == "GET":
        name = db.execute(
            "SELECT symbol FROM purchases WHERE username = (SELECT username FROM users WHERE id = ?)", session["user_id"])
        return render_template("sell.html", names=name)


def errorhandler(e):
    """Handle error"""
    if not isinstance(e, HTTPException):
        e = InternalServerError()
    return apology(e.name, e.code)


# Listen for errors
for code in default_exceptions:
    app.errorhandler(code)(errorhandler)
