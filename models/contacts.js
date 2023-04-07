const fs = require('fs/promises')
const path = require('path')
const nodeid = require('node-id')

const contactsPath = path.resolve(__dirname,'contacts.json')

const listContacts = async () => { 
  try {
    const data = await fs.readFile(contactsPath, { encoding: 'utf-8' })
    const contactList = JSON.parse(data) 
    return contactList
  } catch (error) {
    console.log(error)
  }
}

const getContactById = async (contactId) => {
  try {
    const contactsList = await listContacts()
    const getContact = contactsList.find(({ id }) => id === contactId)
    return getContact
  } catch (error) {
    console.log(error)
  }
}

const removeContact = async (contactId) => {
  try {
    const contactsList = await listContacts();
    const newContactsList = contactsList.filter(({ id }) => id !== contactId);
    await fs.writeFile(contactsPath, JSON.stringify(newContactsList, null, 2), { encoding: 'utf-8' });
  } catch (error) {
    console.log(error);
  }
}

const addContact = async (body) => {
  try {
    const contactsList = await listContacts();
    let contactId = nodeid();
    const newContact = { id: contactId, name: body.name, email: body.email, phone: body.phone };
    const newContactsList = [...contactsList, newContact];
    await fs.writeFile(contactsPath, JSON.stringify(newContactsList, null, 2), { encoding: 'utf-8' });
    return newContact
  } catch (error) {
    console.log(error);
  }
}

const updateContact = async (contactId, body) => {
 try{
    const contactsList = await listContacts();
    const contactIndexNumber = contactsList.findIndex(contact => contact.id === contactId);
    const contact = await getContactById(contactId);
    contactsList[contactIndexNumber] = { id: contactId, name: body.name || contact.name, email: body.email || contact.email, phone: body.phone || contact.phone };
    await fs.writeFile(contactsPath, JSON.stringify(contactsList, null, 2), { encoding: 'utf-8' });
    return contactsList[contactIndexNumber]
 } catch (error) {
    console.log(error);
  }
}

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
}

