import MySQLdb as _mysql
from collections import namedtuple
import re

float_match = re.compile(r'[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$').match

def is_number(string):
    return bool(float_match(string))

class MySQLDatabase(object):
#---------------------------------------------------------------------------------------------

    """
    This is the driver class that we will use
    for connecting to our database. In here we'll
    create a constructor (__init__) that will connect
    to the database once the driver class is instantiated
    and a destructor method that will close the database
    connection once the driver object is destroyed.
    """

    def __init__(self, database_name, username, password, host):
        try:
            self.db = _mysql.connect(db=database_name,host=host,user=username,passwd=password)
            self.databasename = database_name
            print "Connected to MySQL!"
        except _mysql.Error, e:
            print e
#---------------------------------------------------------------------------------------------
    def __del__(self):
        """
        Here we'll do a check to see if `self.db` is present.
        This will only be the case if the connection was
        successfully made in the initialiser.
        Inside that condition we'll close the connection
        """

        if hasattr(self, "db"):
            self.db.close()
            print "MySQL Connection Closed!"

# ---------------------------------------------------------------------------------------------



# ---------------------------------------------------------------------------------------------

    def get_available_tables(self):
        cursor = self.db.cursor()
        cursor.execute("SHOW TABLES")
        self.tables = cursor.fetchall()

        cursor.close()

        return self.tables

# ---------------------------------------------------------------------------------------------
    def get_columns_for_table(self, table_name):
        """
        This method will enable to interact
        with our database to find what columns
        are currently in a specific table
        """
        cursor = self.db.cursor()
        cursor.execute("SHOW COLUMNS FROM %s" % table_name)
        self.columns = cursor.fetchall()

        cursor.close()

        return self.columns

# ---------------------------------------------------------------------------------------------
    def convert_to_named_tuples(self, cursor):
        results = None
        names = " ".join(d[0] for d in cursor.description)
        #print "Names %s: " % names
        klass = namedtuple("Results", names)

        try:
            results = map(klass._make, cursor.fetchall())
        except _mysql.ProgrammingError, e:
            print e

        return results

# ---------------------------------------------------------------------------------------------



# ---------------------------------------------------------------------------------------------
    def select(self, table_name, columns = None, named_tuples = False, **kwargs):
        """
            We'll create our `select` method in order
            to make it simpler for extracting data from
            the database.
            select(table_name, [list_of_column_names])
        """
        # if UNION then put an opening bracket at the start of the select statement
        if kwargs.has_key("UNION"):
            strsql = "(SELECT "
        else:
            strsql = "SELECT "

        # add columns OR the wildcard, if no columns sent to function
        if not columns:
            strsql += "* "
        else:
            for column in columns:
                strsql += "%s, " % column

            #remove the last comma and space (two characters)
            strsql = strsql[:-2]

        # add the table to the SELECT query

        strsql += " FROM %s.%s " % (self.databasename, table_name)

        # add the JOIN clause if it was sent to the **kwargs variable
        if kwargs.has_key("JOIN"):
            strsql += " JOIN %s " % kwargs.get('JOIN')

        # add the WHERE clause if it was sent to the **kwargs variable
        if kwargs.has_key("WHERE"):
            strsql += " WHERE %s " % kwargs.get("WHERE")

        if kwargs.has_key("GROUPBY"):
            strsql += " GROUP BY %s " % kwargs.get("GROUPBY")

        # add the ORDER BY clause if it was sent to the **kwargs variable
        if kwargs.has_key("ORDERBY"):
            strsql += " ORDER BY %s " % kwargs.get("ORDERBY")

        # add the LIMIT clause if it was sent to the **kwargs variable
        if kwargs.has_key("LIMIT"):
            strsql += " LIMIT %s " % kwargs.get("LIMIT")

        #if UNION then put closing bracket at end of statement
        if kwargs.has_key("UNION"):
            if kwargs.get("UNION") == True:
                strsql += ") "
        else:
            #then close the query with ';'
            strsql += ";"

        print strsql
        self.qry_string = strsql

        # if UNION then don't run the query just return the full sql
        if kwargs.has_key("UNION"):
            return self.qry_string

        cursor = self.db.cursor()
        cursor.execute(strsql)

        if named_tuples:
            results = self.convert_to_named_tuples(cursor)
        else:
            results = cursor.fetchall()

        cursor.close()

        return results

#---------------------------------------------------------------------------------------------

    def union(self, qry_str1, qry_str2, named_tuples = False, union_all = False):

        #This currently only caters for two queries unioned
        #Can add more if needed later

        strsql = qry_str1

        if union_all:
            strsql += " UNION ALL "
        else:
            strsql += " UNION "

        strsql += qry_str2

        # then close the query with ';'
        strsql += ";"

        self.qry_string = strsql

        cursor = self.db.cursor()
        cursor.execute(strsql)

        if named_tuples:
            results = self.convert_to_named_tuples(cursor)
        else:
            results = cursor.fetchall()

        cursor.close()

        return results

#---------------------------------------------------------------------------------------------
    def delete(self, table, **kwargs):
        """
            This function will allow us
            to delete data from a given table
            based on whether or not a WHERE
            clause is present or not
            If WHERE clause is not present, it is like saying "DELETE * FROM ..."
        """
        strsql = "DELETE FROM %s.%s " % (self.databasename, table)

        if kwargs is not None:
            first_where_clause = True
            for where, term in kwargs.iteritems():
                if first_where_clause:
                    #first WHERE clause only
                    strsql += " WHERE %s.%s %s" % (table, where, term)
                    first_where_clause = False
                else:
                    #for all other WHERE clause items
                    strsql += " AND %s.%s %s" % (table, where, term)

        strsql += ";"
        self.qry_string = strsql #allows user to see the query text

        cursor = self.db.cursor()

        try:
            cursor.execute(strsql)
            self.db.commit()
            cursor.close()

        except _mysql.ProgrammingError, e:
            print "Error is: %s \nQuery is: %s" % (e, strsql)



# ---------------------------------------------------------------------------------------------

    def insert(self, table, **column_names):
        """
            Insert function.

            Example Usage:-
            db.insert('people', first_name='Ringo',
                      second_name='Starr', DOB=STR_TO_DATE(
                                               '01-01-1999', '%d-%m-%Y'))
        """
        strsql = "INSERT INTO %s.%s " % (self.databasename, table)

        if column_names is not None:
            columns = "("
            values = "("
            for arg, value in column_names.iteritems():
                columns += "%s, " % arg

                #check how the value should be added e.g. string or not?
                if is_number(value):
                    values += "%s, " % value
                else:
                    values += "'%s', " % value

            columns = columns[:-2] #take of last comma and space
            values = values[:-2] #same with the values

            columns += ") VALUES"
            values += ");"

            strsql += "%s %s " % (columns, values)
            self.qry_string = strsql  # allows user to see the query text

            cursor = self.db.cursor()

            try:
                cursor.execute(strsql)
                self.db.commit()
                cursor.close()

            except _mysql.ProgrammingError, e:
                print "Error is: %s \nQuery is: %s" % (e, strsql)

# ---------------------------------------------------------------------------------------------
    def update(self, table, where=None,**column_values):
        strsql = "UPDATE %s.%s SET " % (self.databasename, table)

        if column_values is not None:
            for column_name, value in column_values.iteritems():
                strsql += "%s=" % column_name

                #check how the value should be added e.g. string or not?
                if is_number(value):
                    strsql += "%s, " % value
                else:
                    strsql += "'%s', " % value

        strsql = strsql[:-2] #remove comma and space at end

        if where:
            strsql += " WHERE %s" % where

        self.qry_string = strsql  # allows user to see the query text

        cursor = self.db.cursor()

        try:
            cursor.execute(strsql)
            self.db.commit()
            cursor.close()

        except _mysql.ProgrammingError, e:
            print "Error is: %s \nQuery is: %s" % (e, strsql)


