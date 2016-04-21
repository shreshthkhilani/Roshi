#!/usr/bin/python

import sys
import boto3

dynamodb = boto3.resource('dynamodb')

def delete_user(email):
	recco = dynamodb.Table("recommended")
	interested = dynamodb.Table("interested")
	users = dynamodb.Table("users")
	try:
	    response = recco.delete_item(Key={'email': email})
	    response = users.delete_item(Key={'email': email})
	    response = interested.delete_item(Key={'email': email})
	except ClientError as e:
	    if e.response['Error']['Code'] == "ConditionalCheckFailedException":
	        print(e.response['Error']['Message'])
	    else:
	        raise
	else:
	    print("DeleteItem succeeded:")


delete_user(sys.argv[1])


