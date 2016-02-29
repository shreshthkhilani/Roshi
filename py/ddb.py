# 
# DDB API
# 
# Get Started:
# "import ddb as ddb"
#

import boto3

dynamodb = boto3.resource('dynamodb')

# Get user given email
# Usage:
# "ddb.get_users('shreshth@seas.upenn.edu')"
# No error checking
def get_users (key):
	table = dynamodb.Table('users')
	response = table.get_item(Key={'email':key})
	return response['Item']

# Get recommendations given email
# Usage:
# "ddb.get_recommended('shreshth@seas.upenn.edu')"
# No error checking
def get_recommended (key):
	table = dynamodb.Table('recommended')
	response = table.get_item(Key={'email':key})
	return response['Item']

# Get interests given email
# Usage:
# "ddb.get_interested('shreshth@seas.upenn.edu')"
# No error checking
def get_interested (key):
	table = dynamodb.Table('interested')
	response = table.get_item(Key={'email':key})
	return response['Item']
