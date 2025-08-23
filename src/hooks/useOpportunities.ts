import { useState, useEffect } from 'react';
import { Opportunity } from '../types';
import * as opportunityService from '../services/opportunities';

export const useOpportunities = () => {

  // Opportunity interface being called here. It has all the attributes to create an opportunity. 
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // error can either be string or null. the initial value is null
  const [error, setError] = useState<string | null>(null);


  // fetching opportunities
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      setError(null);

      // this is a call to the backend where the opportunities are fetched in the DB. Look up to the imports to see where we are getting it from. 
      const data = await opportunityService.getOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      setError('Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }

    //what is finally. I think it executes whatever happens inside of the function. 
  };

  // creates a new opportunity, calling the backend function to create it in the backend. 
  const createOpportunity = async (opportunity: Omit<Opportunity, 'id'>) => {
    try {
      const newOpportunity = await opportunityService.createOpportunity(opportunity);
      // Update state immediately to reflect the new opportunity
      setOpportunities(prev => [newOpportunity, ...prev]);
      return newOpportunity;
    } catch (err) {
      console.error('Error creating opportunity:', err);
      throw err;
    }
  };

  // UPDATES THE OPPORTUNITY. I THINK THIS WAS BROKEN, MIGHT HAVE TO COME BACK TO THIS
  const updateOpportunity = async (id: string, opportunity: Partial<Omit<Opportunity, 'id'>>) => {
    try {
      const updatedOpportunity = await opportunityService.updateOpportunity(id, opportunity);
      // Update state immediately to reflect the changes
      setOpportunities(prev => 
        prev.map(opp => opp.id === id ? updatedOpportunity : opp)
      );
      return updatedOpportunity;
    } catch (err) {
      console.error('Error updating opportunity:', err);
      throw err;
    }
  };

  // delete an opportuntiy
  const deleteOpportunity = async (id: string): Promise<void> => {
    try {
      await opportunityService.deleteOpportunity(id);
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
    } catch (err) {
      console.error('Error deleting opportunity:', err);
      throw err;
    }
  };

  // fetches the opportunities after the first render. Might have to come back to this is opportunities aren't being fetched correctly. 
  useEffect(() => {
    fetchOpportunities();
  }, []);

  // returns all the const api function calls. 
  return {
    opportunities,
    loading,
    error,
    createOpportunity,
    updateOpportunity,
    deleteOpportunity,
    refreshOpportunities: fetchOpportunities
  };
};