import csv, json

# the files to be read and written
csv_file_path = "CentralizedUseCases.csv"
json_file_path = "test.json"

# this data will later be converted to json format
formatted_data = []

unwanted_char_errors = "()"
# read the csv file to our data array
with open(csv_file_path, encoding ='utf8') as csvFile:
    csvReader = csv.DictReader(csvFile)

    # append the current row of the csv file to data array
    for csvRow in csvReader:
        updated_link = csvRow["link"]

        # clean up the erroneous links by cutting "(" and ")" from them
        for char in unwanted_char_errors:
            updated_link = updated_link.replace(char, "")
        csvRow["link"] = updated_link
        formatted_data.append(csvRow)


# dump the data array into a json format
with open(json_file_path, "w") as jsonFile:
    jsonFile.write(json.dumps(formatted_data, indent=4))
