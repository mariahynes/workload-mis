import collections
import json
import datetime
import os

from flask import Flask
from flask import render_template

from database.mysql import MySQLDatabase
from database.settings_db import db_config
from database.settings_db import db_config_local

app = Flask(__name__)

is_heroku = os.environ.get("IS_HEROKU", None)

if is_heroku:
    db = MySQLDatabase(
        db_config.get("db_name"),
        db_config.get("user"),
        db_config.get("pass"),
        db_config.get("host")
    )
else:
    db = MySQLDatabase(
        db_config_local.get("db_name"),
        db_config_local.get("user"),
        db_config_local.get("pass"),
        db_config_local.get("host")
    )

#REUSUABLE FUNCTIONS
def data_table():
    """
    use this function to refer to the table name in all queries below
    NOTE: time_spent, the_year and month_number are number data types in the DD
    so need to convert to str when using this table
    """
    return "mis_data_txt"

def latest_month():

    # this will search the table for the LATEST month data available and return the month name
    try:
        the_latest_month_qry = db.select(data_table(), ['month_name', 'the_year'], named_tuples=True,
                                     ORDERBY='the_year DESC, month_number DESC', LIMIT='1')

        for row in the_latest_month_qry:
            the_latest_month = row.month_name

        return the_latest_month

    except:
        print('Error in latest_month!')


def latest_year():
    # this will search the table for the LATEST year data available and return the year
    # formatted as a string
    try:
        the_latest_month_qry = db.select(data_table(), ['month_name', 'the_year'], named_tuples=True, ORDERBY='the_year DESC, month_number DESC', LIMIT='1')

        for row in the_latest_month_qry:
            the_latest_year = row.the_year

        return the_latest_year

    except:
        print("Error in latest_year")

def earliest_month_in_latest_year():
    #this will search the table for the LATEST year data available and return the name of the earliest month available
    try:
        the_earliest_month_qry = db.select(data_table(), ['month_name', 'the_year'], named_tuples=True,
                                         ORDERBY='the_year DESC, month_number ASC', LIMIT='1')


        for row in the_earliest_month_qry:
            the_earliest_month = row.month_name

        return the_earliest_month
    except:
        print("Error in earliest_month_in_latest_year")

def current_year():
    now = datetime.datetime.now()
    the_current_year = now.year

    return the_current_year

@app.route('/')
def home():

    the_latest_month = latest_month()
    the_latest_year = latest_year()

    return render_template('home.html', the_month=the_latest_month, the_year=the_latest_year,the_title="Home")


""" THIS ROUTE IS NOT IN USE YET"""
@app.route('/previous/<int:user_year>')
def previous_year(user_year):

    if user_year:
        the_latest_year = user_year
    else:
        the_latest_year = latest_year()

    the_latest_month = latest_month()

    return render_template('home.html', the_month=the_latest_month, the_year=the_latest_year)

@app.route("/MIS/categoryMonth")
def month_data():
    #this is called from the Home Page and again uses for the LATEST month data available
    print("CategoryMonth function")
    the_latest_month = latest_month()
    the_latest_year = latest_year()
    print("latest month: " + str(the_latest_month))
    print("latest year: " + str(the_latest_year))

    #all_records = db.select(data_table(), ['category_name','SUM(time_spent) AS time_spent','team_name', 'month_name', 'the_year'],
    #                        WHERE="the_year= " + str(the_latest_year) + " AND month_name= '" + str(the_latest_month) + "'",
    #                        named_tuples=True, GROUPBY='team_name,category_name', LIMIT='10000')

    all_records = db.select(data_table(),
                            ['category_name', 'SUM(time_spent) AS time_spent', 'team_name', 'month_name', 'the_year'],
                            WHERE="the_year= " + str(the_latest_year) + " AND month_name= '" + str(
                                the_latest_month) + "'",
                            named_tuples=True, GROUPBY='team_name,category_name', LIMIT='10000')

    json_mis = []
    for record in all_records:
        d = collections.OrderedDict()
        d['team_name'] = record.team_name
        d['category_name'] = record.category_name
        d['time_spent'] = str(record.time_spent)
        d['month_name'] = record.month_name
        d['the_year'] = str(record.the_year)
        json_mis.append(d)
    json_mis = json.dumps(json_mis)
    return json_mis

@app.route("/MIS/dealDataMonth")
def month_deal_data():
    # this is called from the Home Page and again uses the LATEST month data available
    print("DealDataMonth Function")
    the_latest_month = latest_month()
    the_latest_year = latest_year()
    print("latest month: " + str(the_latest_month))
    print("latest year: " + str(the_latest_year))

    apac_records = db.select(data_table(),
                             ['category_name', 'SUM(time_spent) AS Total_Time', 'team_name', 'month_name',
                              'model_name', 'the_year'],
                             WHERE="model_name NOT IN('NA', 'N/A') AND the_year=" + str(the_latest_year) + " AND month_name= '" + str(the_latest_month) + "' AND team_name !='EMEA'",
                             named_tuples=True, GROUPBY='model_name', ORDERBY='Total_Time DESC', UNION=True,
                             LIMIT='5')

    emea_records = db.select(data_table(),
                             ['category_name', 'SUM(time_spent) AS Total_Time', 'team_name', 'month_name',
                              'model_name', 'the_year'],
                             WHERE="model_name NOT IN('NA', 'N/A') AND the_year=" + str(the_latest_year) + " AND month_name= '" + str(the_latest_month) + "' AND team_name ='EMEA'",
                             named_tuples=True, GROUPBY='model_name', ORDERBY='Total_Time DESC', UNION=True,
                             LIMIT='5')

    all_records = db.union(apac_records, emea_records,named_tuples=True,union_all=True)

    json_mis = []
    for record in all_records:
        d = collections.OrderedDict()
        d['team_name'] = record.team_name
        d['category_name'] = record.category_name
        d['Total_Time'] = str(record.Total_Time)
        d['model_name'] = record.model_name
        d['month_name'] = record.month_name
        d['the_year'] = str(record.the_year)
        json_mis.append(d)
    json_mis = json.dumps(json_mis)

    return json_mis




@app.route('/charts')
def charts():
    # need year of data, first and last month of that year
    the_latest_month = latest_month()
    the_latest_year = latest_year()
    the_earliest_month = earliest_month_in_latest_year()

    return render_template('charts.html', the_first_month=the_earliest_month, the_last_month=the_latest_month,
                           the_data_year=the_latest_year,the_title="Charts")


@app.route("/MIS/teamData")
def team_data():
    # this is called from the Charts Page and returns ALL data available (limit 20000)
    the_latest_year = latest_year()

    all_records = db.select(data_table(), WHERE="the_year=" + str(the_latest_year), named_tuples=True, LIMIT='20000')

    json_mis = []
    for record in all_records:
        d = collections.OrderedDict()
        d['model_name'] = record.model_name
        d['date_entered'] = record.date_entered
        d['user_name'] = record.user_name
        d['function_name'] = record.function_name
        d['time_spent'] = str(record.time_spent)
        d['team_name'] = record.team_name
        d['category_name'] = record.category_name
        d['the_year'] = str(record.the_year)
        d['month_name'] = record.month_name
        d['month_number'] = str(record.month_number)
        json_mis.append(d)

    json_mis = json.dumps(json_mis)
    return json_mis

@app.route('/deals')
def deals():
    #need year of data, first and last month of that year
    the_latest_month = latest_month()
    the_latest_year = latest_year()
    the_earliest_month = earliest_month_in_latest_year()

    return render_template('deals.html', the_first_month=the_earliest_month, the_last_month=the_latest_month,
                           the_data_year=the_latest_year, the_title="Deals/Projects")

@app.route("/MIS/dealData")
def deal_data():
    # need year of data, first and last month of that year
    the_latest_year = latest_year()

    all_records = db.select(data_table(),
                            ['category_name', 'time_spent', 'team_name', 'date_entered','month_name', 'model_name',
                             'the_year', 'month_number'], WHERE="the_year = " + str(the_latest_year) + " AND model_name !='N/A'", named_tuples=True,
                            LIMIT='20000')

    json_mis = []
    for record in all_records:
        d = collections.OrderedDict()
        d['team_name'] = record.team_name
        d['category_name'] = record.category_name
        d['time_spent'] = str(record.time_spent)
        d['date_entered'] = record.date_entered
        d['model_name'] = record.model_name
        d['month_name'] = record.month_name
        d['the_year'] = str(record.the_year)
        d['month_number'] = str(record.month_number)
        json_mis.append(d)
    json_mis = json.dumps(json_mis)

    return json_mis


@app.route('/functions')
def functions():
    # need year of data, first and last month of that year
    the_latest_month = latest_month()
    the_latest_year = latest_year()
    the_earliest_month = earliest_month_in_latest_year()

    return render_template('functions.html',the_first_month=the_earliest_month, the_last_month=the_latest_month,
                           the_data_year=the_latest_year, the_title="Functions")

@app.route("/MIS/functionData")
def function_data():
    # need year of data, first and last month of that year
    the_latest_year = latest_year()

    all_records = db.select(data_table(),
                            ['category_name', 'time_spent', 'team_name', 'date_entered','month_name', 'function_name',
                             'the_year', 'month_number'], WHERE="the_year = " + str(the_latest_year), named_tuples=True,
                            LIMIT='20000')

    json_mis = []
    for record in all_records:
        d = collections.OrderedDict()
        d['team_name'] = record.team_name
        d['category_name'] = record.category_name
        d['time_spent'] = str(record.time_spent)
        d['date_entered'] = record.date_entered
        d['function_name'] = record.function_name
        d['month_name'] = record.month_name
        d['the_year'] = str(record.the_year)
        d['month_number'] = str(record.month_number)
        json_mis.append(d)
    json_mis = json.dumps(json_mis)

    return json_mis


@app.route('/people')
def people():
    # need year of data, first and last month of that year
    the_latest_month = latest_month()
    the_latest_year = latest_year()
    the_earliest_month = earliest_month_in_latest_year()

    return render_template('people.html',the_first_month=the_earliest_month, the_last_month=the_latest_month,
                           the_data_year=the_latest_year,the_title="People")


@app.route("/MIS/peopleData")
def people_data():
    # need year of data, first and last month of that year
    the_latest_year = latest_year()

    all_records = db.select(data_table(),
                            ['category_name', 'time_spent', 'team_name', 'date_entered','month_name', 'user_name',
                             'the_year', 'month_number'], WHERE="the_year = " + str(the_latest_year), named_tuples=True,
                            LIMIT='20000')

    json_mis = []
    for record in all_records:
        d = collections.OrderedDict()
        d['team_name'] = record.team_name
        d['category_name'] = record.category_name
        d['time_spent'] = str(record.time_spent)
        d['date_entered'] = record.date_entered
        d['user_name'] = record.user_name
        d['month_name'] = record.month_name
        d['the_year'] = str(record.the_year)
        d['month_number'] = str(record.month_number)
        json_mis.append(d)
    json_mis = json.dumps(json_mis)

    return json_mis

if __name__ == '__main__':
    app.run(debug=True)

