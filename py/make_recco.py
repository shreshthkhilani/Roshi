#!/usr/bin/python

import sys
import boto3
import re
import os
import string
import json
import ddb
import ast
import random
import operator

dynamodb = boto3.resource('dynamodb')
def top_words(lst):
	words = {}
	for val in lst:
		for x in val["position"].split(" "):
			if x.lower() in words:
				words[x] = words[x] + 1
			else:
				words[x] = 1
	sorted_words = sorted(words.items(), key=operator.itemgetter(1))[0:5]
	final_lst = []
	for tup in sorted_words:
		final_lst.append(tup[0].lower())
	final_lst = list(set(final_lst))
	if "internship" in final_lst:
		final_lst.remove("internship")
	if "intern" in final_lst:
		final_lst.remove("intern")
	return final_lst

def make_recommendations(email,data):
	interests = ddb.get_interested(email)
	job_id_list = []
	lst_map = ast.literal_eval(interests["value"])
	for i in lst_map:
		job_id_list = lst_map[i]
	if len(job_id_list) == 0:
		populate_initial_recco(email, data)
		return
	comp_loc1 = ['washington, dc', 'philadelphia, pa', 'new york, ny', 'boston, ma']
	comp_loc2 = ['san francisco, ca', 'los angeles, ca']
	job_list = [ast.literal_eval(x["value"]) for x in ddb.get_jobs_list(job_id_list)]
	locations = list(set([x["location"] for x in job_list]))
	technicalities = list(set([x["technicality"] for x in job_list]))
	typ = list(set([x["type"] for x in job_list]))
	final_loc = []
	for loc in locations:
		if loc.lower() in comp_loc1:
			final_loc.extend(comp_loc1)
		elif loc.lower() in comp_loc2:
			final_loc.extend(comp_loc2)
	locations = list(set(final_loc))
	word_lst = top_words(job_list)
	reco_list = []
	for val in data:
		if data[val]["location"].lower() in locations and data[val].has_key("technicality"):
			if data[val]["technicality"] in technicalities:
				if data[val]["type"] in typ:
					for w in word_lst:
						if data[val].has_key("position"):
							if w in data[val]["position"].lower():
								reco_list.append(int(val))
	reco_list.extend(job_id_list)
	reco_list = list(set(reco_list))
	random.shuffle(reco_list)
	reco_list = reco_list[0:30]
	db_map = {}
	db_map["email"] = email
	db_map["value"] = json.dumps({'rlist':reco_list})
	table = dynamodb.Table("recommended")
	table.put_item(Item=db_map)
	#print locations
	#print technicalities

def populate_initial_recco(email, jobs):
	user = ddb.get_users(email)
	data = json.loads(user["value"])
	s_type = ""
	if len(data["school"]) == 0:
		if "wharton" in email:
			s_type = "wharton"
		elif "seas" in email:
			s_type = "engineering"
		elif "nursing" in email:
			s_type = "nursing"
		else:
			s_type = "sas"
	else:
		s_type = data["school"][0]

	technicality = 3
	terms = []
	for work in data["work"]:
		pos = (data["work"][work]["position"]).lower()
		if pos != "":
			if ("engineering" in pos) or ("software" in pos):
				technicality = 5
				terms = ['software', 'engineering', 'developer']
			elif "associate" in pos or "analyst" in pos:
				technicality = 4
				terms = ['analyst', 'quant', 'associate']
			elif "manager" in pos:
				technicality = 3
				terms = ['manager']
			elif "writer" in pos or "artist" in pos:
				technicality = 1
				terms = ['writer', 'artist']
		else:
			if s_type == "wharton":
				technicality = 4
				terms = ['analyst', 'quant', 'associate']
			elif s_type == "seas":
				technicality = 5
				terms = ['software', 'engineering', 'developer']
			else:
				technicality = 3
	pos_type = "";
	if data["year"] != 0:
		if int(data["year"].encode('utf-8')) == 2016:
			pos_type = "Full Time"
		else:
			pos_type = "Intern"
	reco_list = []
	for val in jobs:
		if jobs[val].has_key("position"):
			for term in terms:
				if term in jobs[val]["position"].lower():
					reco_list.append(int(val))
		if jobs[val].has_key("technicality"):
			if jobs[val]["technicality"] == technicality:
				if jobs[val]["type"] == pos_type:
					reco_list.append(int(val))
	reco_list = list(set(reco_list))
	random.shuffle(reco_list)
	reco_list = reco_list[0:30]
	db_map = {}
	db_map["email"] = email
	db_map["value"] = json.dumps({'rlist':reco_list})
	table = dynamodb.Table("recommended")
	table.put_item(Item=db_map)

with open('position_data.json') as data_file:
	data = json.load(data_file)

make_recommendations(sys.argv[1], data)


