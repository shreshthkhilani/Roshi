#!/usr/bin/python

import sys
import boto3
import re
import os
import string
import json
import ddb
import ast

dynamodb = boto3.resource('dynamodb')

def make_recommendations(email,data):
	interests = ddb.get_interested(email);
	job_id_list = []
	lst_map = ast.literal_eval(interests["value"])
	for i in lst_map:
		job_id_list = lst_map[i]
	job_list = [ast.literal_eval(x["value"]) for x in ddb.get_jobs_list(job_id_list)]
	locations = list(set([x["location"] for x in job_list]))
	technicalities = list(set([x["technicality"] for x in job_list]))
	typ = list(set([x["type"] for x in job_list]))
	reco_list = []
	for val in data:
		if data[val]["location"] in locations and data[val].has_key("technicality"):
			if data[val]["technicality"] in technicalities:
				if data[val]["type"] in typ:
					reco_list.append(int(val))
	reco_list.extend(job_id_list)
	reco_list = list(set(reco_list))
	db_map = {}
	db_map["email"] = email
	db_map["value"] = json.dumps({'rlist':reco_list})
	table = dynamodb.Table("recommended")
	table.put_item(Item=db_map)
	#print locations
	#print technicalities


with open('position_data.json') as data_file:
	data = json.load(data_file)

make_recommendations(sys.argv[1], data)


