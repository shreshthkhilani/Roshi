# 
# DDB API
# 
# Get Started:
# "import ddb as ddb"
#

import boto3
import json
from pprint import pprint

dynamodb = boto3.resource('dynamodb')

# Get user given email
# Usage:
# "ddb.get_users('shreshth@seas.upenn.edu')"
# No error checking
def put_jobs(table_name, data):
	table = dynamodb.Table(table_name)
	with table.batch_writer() as batch:
		for val in data:
			temp = {}
			temp["id"] = val
			temp["value"] = "Hello %s"%val #str(data[val])
			try:
				batch.put_item(Item=temp)
				print("Inserted value %s"%val)
			except:
				print("Failed ID: %s"%val)
	#table = dynamodb.Table('users')
	#response = table.get_item(Key={'email':key})
	#return response['Item']

with open('Roshi/position_data.json') as data_file:
	data = json.load(data_file)
put_jobs("jobs", data);

# {"id":0,"value":}