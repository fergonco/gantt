package geomati.co.olakease;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Date;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

public class SavePlan extends HttpServlet {
	private static final long serialVersionUID = 1L;

	protected void doPost(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		File file = new File("/home/fergonco/b/java/olakease/"
				+ "gantt/src/main/resources" + "/nfms/modules/plan.json");
		
		File backupFile = new File(file.getParentFile(), "plan-"
				+ new Date().getTime() + ".json");
		FileUtils.copyFile(file, backupFile);

		BufferedReader reader = req.getReader();
		OutputStream out = new FileOutputStream(file);
		IOUtils.copy(reader, out, "UTF-8");

		out.close();

		resp.setStatus(HttpServletResponse.SC_OK);
	}

}
