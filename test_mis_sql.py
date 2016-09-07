import unittest
import datetime
from mis_sql import data_table
from mis_sql import latest_month
from mis_sql import latest_year
from mis_sql import earliest_month_in_latest_year
from mis_sql import current_year
from mis_sql import home
from mis_sql import app

class TestMISSQL(unittest.TestCase):

    def test_data_table_name(self):
        the_table_name = data_table()
        self.assertEqual(the_table_name,"mis_data_txt", "Not the correct table")

    def test_latest_month(self):
        the_month = latest_month()
        self.assertIsNotNone(the_month,"Month Name has no value")


    def test_latest_year(self):
        the_year = latest_year()
        print the_year
        self.assertGreater(the_year,2014, "Must be 2015 or later")

    def test_earliest_month_in_latest_year(self):
        the_earliest_month = earliest_month_in_latest_year()
        self.assertIsNotNone(the_earliest_month, "Month Name has no value")

    def test_current_year(self):
        this_year = current_year()
        now = datetime.datetime.now()
        self.assertEqual(this_year,now.year, "Not the correct year")

